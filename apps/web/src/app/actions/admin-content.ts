"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma, type Locale, type NoticeKind, type PublishStatus, type ContactStatus, type PageKind } from "@vgmf/db";
import { assertCan, type SessionUser } from "@vgmf/auth";
import { audit, type PermissionKey } from "@vgmf/core";
import { locales } from "@vgmf/i18n";
import { auditContext, getSessionUser } from "@/lib/session";
import { localePath } from "@/lib/admin";
import { cleanHtml } from "@/lib/html";
import { isValidSlug, slugify } from "@/lib/slug";
import type { ActionState } from "@/lib/forms";

type Tr = Record<string, string>;

/** Collect `tr.<locale>.<field>` inputs into { en: {...}, mr: {...}, hi: {...} }. */
function readTranslations(form: FormData, fields: string[], htmlFields: string[] = []): Partial<Record<Locale, Tr>> {
  const out: Partial<Record<Locale, Tr>> = {};
  for (const loc of locales) {
    const row: Tr = {};
    let any = false;
    for (const f of fields) {
      const raw = String(form.get(`tr.${loc}.${f}`) ?? "").trim();
      const v = htmlFields.includes(f) ? cleanHtml(raw) : raw;
      row[f] = v;
      if (v) any = true;
    }
    if (any) out[loc] = row;
  }
  return out;
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}
function opt(form: FormData, key: string): string | null {
  return str(form, key) || null;
}
function bool(form: FormData, key: string): boolean {
  return form.get(key) === "1" || form.get(key) === "on";
}
function int(form: FormData, key: string, fallback = 0): number {
  const n = Number(str(form, key));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function date(form: FormData, key: string): Date | null {
  const v = str(form, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function status(form: FormData): PublishStatus {
  const v = str(form, "status");
  return v === "PUBLISHED" || v === "ARCHIVED" ? v : "DRAFT";
}
function uuid(form: FormData, key: string): string | null {
  const v = str(form, key);
  return z.string().uuid().safeParse(v).success ? v : null;
}

async function actor(permission: PermissionKey): Promise<SessionUser> {
  const user = await getSessionUser();
  assertCan(user, permission);
  return user;
}

async function resolveSlug(model: "article" | "page" | "doctor" | "clinic" | "articleCategory", form: FormData, fallbackTitle: string, excludeId?: string): Promise<string | ActionState> {
  const base = slugify(str(form, "slug") || fallbackTitle);
  if (!base || !isValidSlug(base)) return { ok: false, error: "Slug is required", fieldErrors: { slug: "Enter a valid slug (letters, numbers, hyphens)" } };
  const exists = async (s: string) => {
    const where = { slug: s, ...(excludeId ? { NOT: { id: excludeId } } : {}) };
    switch (model) {
      case "article": return (await prisma.article.count({ where })) > 0;
      case "page": return (await prisma.page.count({ where })) > 0;
      case "doctor": return (await prisma.doctor.count({ where })) > 0;
      case "clinic": return (await prisma.clinic.count({ where })) > 0;
      case "articleCategory": return (await prisma.articleCategory.count({ where })) > 0;
    }
  };
  let slug = base;
  for (let i = 2; await exists(slug); i++) slug = `${base}-${i}`;
  return slug;
}

function revalidatePublic() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function saveArticleAction(_: ActionState, form: FormData): Promise<ActionState> {
  const id = uuid(form, "id");
  const user = await actor(id ? "articles:edit" : "articles:create");
  const tr = readTranslations(form, ["title", "excerpt", "body", "metaTitle", "metaDescription"], ["body"]);
  if (!tr.en?.title) return { ok: false, error: "English title is required", fieldErrors: { "tr.en.title": "Required" } };
  const enTitle = tr.en.title;
  const slug = await resolveSlug("article", form, enTitle, id ?? undefined);
  if (typeof slug !== "string") return slug;
  const st = status(form);
  if (st === "PUBLISHED") assertCan(user, "articles:publish");

  const data = {
    slug,
    status: st,
    featured: bool(form, "featured"),
    authorName: opt(form, "authorName"),
    categoryId: uuid(form, "categoryId"),
    coverMediaId: uuid(form, "coverMediaId"),
    publishedAt: date(form, "publishedAt") ?? (st === "PUBLISHED" ? new Date() : null),
    updatedById: user.id,
  };
  const translations = Object.entries(tr).map(([locale, t]) => ({
    locale: locale as Locale,
    title: t.title || enTitle,
    excerpt: t.excerpt || null,
    body: t.body || "",
    metaTitle: t.metaTitle || null,
    metaDescription: t.metaDescription || null,
  }));

  const article = id
    ? await prisma.$transaction(async (tx) => {
        const a = await tx.article.update({ where: { id }, data });
        await tx.articleTranslation.deleteMany({ where: { articleId: id, locale: { notIn: translations.map((t) => t.locale) } } });
        for (const t of translations) {
          await tx.articleTranslation.upsert({ where: { articleId_locale: { articleId: id, locale: t.locale } }, create: { articleId: id, ...t }, update: t });
        }
        return a;
      })
    : await prisma.article.create({ data: { ...data, createdById: user.id, translations: { create: translations } } });

  await audit(await auditContext(user), { module: "articles", action: id ? "article.updated" : "article.created", summary: `${id ? "Updated" : "Created"} article “${enTitle}” (${st})`, entityType: "Article", entityId: article.id });
  revalidatePublic();
  if (!id) redirect(localePath(await getLocale(), `/admin/content/articles/${article.id}`));
  return { ok: true };
}

export async function deleteArticleAction(form: FormData): Promise<void> {
  const user = await actor("articles:delete");
  const id = uuid(form, "id");
  if (!id) return;
  await prisma.article.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED", updatedById: user.id } });
  await audit(await auditContext(user), { module: "articles", action: "article.deleted", summary: "Archived article", entityType: "Article", entityId: id });
  revalidatePublic();
  redirect(localePath(await getLocale(), "/admin/content/articles"));
}

export async function saveCategoryAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await actor("articles:edit");
  const id = uuid(form, "id");
  const tr = readTranslations(form, ["name"]);
  if (!tr.en?.name) return { ok: false, error: "English name is required" };
  const enName = tr.en.name;
  const slug = await resolveSlug("articleCategory", form, enName, id ?? undefined);
  if (typeof slug !== "string") return slug;
  const translations = Object.entries(tr).map(([locale, t]) => ({ locale: locale as Locale, name: t.name || enName }));
  if (id) {
    await prisma.$transaction(async (tx) => {
      await tx.articleCategory.update({ where: { id }, data: { slug, sortOrder: int(form, "sortOrder") } });
      for (const t of translations) await tx.articleCategoryTranslation.upsert({ where: { categoryId_locale: { categoryId: id, locale: t.locale } }, create: { categoryId: id, ...t }, update: t });
    });
  } else {
    await prisma.articleCategory.create({ data: { slug, sortOrder: int(form, "sortOrder"), translations: { create: translations } } });
  }
  await audit(await auditContext(user), { module: "articles", action: "category.saved", summary: `Saved category “${enName}”`, entityType: "ArticleCategory", entityId: id ?? slug });
  revalidatePublic();
  return { ok: true };
}

export async function deleteCategoryAction(form: FormData): Promise<void> {
  const user = await actor("articles:delete");
  const id = uuid(form, "id");
  if (!id) return;
  await prisma.articleCategory.delete({ where: { id } });
  await audit(await auditContext(user), { module: "articles", action: "category.deleted", summary: "Deleted article category", entityType: "ArticleCategory", entityId: id });
  revalidatePublic();
}

// ---------------------------------------------------------------------------
// Notices / announcements / banners / flyers
// ---------------------------------------------------------------------------

const KINDS: NoticeKind[] = ["ANNOUNCEMENT", "NOTICE", "BANNER", "FLYER"];

export async function saveNoticeAction(_: ActionState, form: FormData): Promise<ActionState> {
  const id = uuid(form, "id");
  const user = await actor(id ? "cms:edit" : "cms:create");
  const tr = readTranslations(form, ["title", "body"], ["body"]);
  if (!tr.en?.title) return { ok: false, error: "English title is required", fieldErrors: { "tr.en.title": "Required" } };
  const enTitle = tr.en.title;
  const st = status(form);
  if (st === "PUBLISHED") assertCan(user, "cms:publish");
  const kind = KINDS.find((k) => k === str(form, "kind")) ?? "NOTICE";
  const data = {
    kind,
    status: st,
    pinned: bool(form, "pinned"),
    sortOrder: int(form, "sortOrder"),
    linkUrl: opt(form, "linkUrl"),
    imageId: uuid(form, "imageId"),
    startsAt: date(form, "startsAt"),
    endsAt: date(form, "endsAt"),
    updatedById: user.id,
  };
  const translations = Object.entries(tr).map(([locale, t]) => ({ locale: locale as Locale, title: t.title || enTitle, body: t.body || null }));
  const notice = id
    ? await prisma.$transaction(async (tx) => {
        const n = await tx.notice.update({ where: { id }, data });
        await tx.noticeTranslation.deleteMany({ where: { noticeId: id, locale: { notIn: translations.map((t) => t.locale) } } });
        for (const t of translations) await tx.noticeTranslation.upsert({ where: { noticeId_locale: { noticeId: id, locale: t.locale } }, create: { noticeId: id, ...t }, update: t });
        return n;
      })
    : await prisma.notice.create({ data: { ...data, createdById: user.id, translations: { create: translations } } });
  await audit(await auditContext(user), { module: "cms", action: id ? "notice.updated" : "notice.created", summary: `${id ? "Updated" : "Created"} ${kind.toLowerCase()} “${enTitle}” (${st})`, entityType: "Notice", entityId: notice.id });
  revalidatePublic();
  if (!id) redirect(localePath(await getLocale(), `/admin/content/notices/${notice.id}`));
  return { ok: true };
}

export async function deleteNoticeAction(form: FormData): Promise<void> {
  const user = await actor("cms:delete");
  const id = uuid(form, "id");
  if (!id) return;
  await prisma.notice.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED", updatedById: user.id } });
  await audit(await auditContext(user), { module: "cms", action: "notice.deleted", summary: "Archived notice", entityType: "Notice", entityId: id });
  revalidatePublic();
  redirect(localePath(await getLocale(), "/admin/content/notices"));
}

// ---------------------------------------------------------------------------
// Pages (custom / legal / system)
// ---------------------------------------------------------------------------

const PAGE_KINDS: PageKind[] = ["CUSTOM", "LEGAL", "SYSTEM"];

export async function savePageAction(_: ActionState, form: FormData): Promise<ActionState> {
  const id = uuid(form, "id");
  const user = await actor(id ? "cms:edit" : "cms:create");
  const tr = readTranslations(form, ["title", "body", "metaTitle", "metaDescription"], ["body"]);
  if (!tr.en?.title) return { ok: false, error: "English title is required", fieldErrors: { "tr.en.title": "Required" } };
  const enTitle = tr.en.title;
  const existing = id ? await prisma.page.findUnique({ where: { id } }) : null;
  const slug = existing?.kind === "LEGAL" || existing?.kind === "SYSTEM" ? existing.slug : await resolveSlug("page", form, enTitle, id ?? undefined);
  if (typeof slug !== "string") return slug;
  const st = status(form);
  if (st === "PUBLISHED") assertCan(user, "cms:publish");
  const data = {
    slug,
    kind: existing?.kind ?? (PAGE_KINDS.find((k) => k === str(form, "kind")) ?? "CUSTOM"),
    status: st,
    showInNav: bool(form, "showInNav"),
    showInApp: bool(form, "showInApp"),
    navOrder: int(form, "navOrder"),
    publishedAt: st === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
    updatedById: user.id,
  };
  const translations = Object.entries(tr).map(([locale, t]) => ({ locale: locale as Locale, title: t.title || enTitle, body: t.body || "", metaTitle: t.metaTitle || null, metaDescription: t.metaDescription || null }));
  const page = id
    ? await prisma.$transaction(async (tx) => {
        const p = await tx.page.update({ where: { id }, data });
        await tx.pageTranslation.deleteMany({ where: { pageId: id, locale: { notIn: translations.map((t) => t.locale) } } });
        for (const t of translations) await tx.pageTranslation.upsert({ where: { pageId_locale: { pageId: id, locale: t.locale } }, create: { pageId: id, ...t }, update: t });
        return p;
      })
    : await prisma.page.create({ data: { ...data, createdById: user.id, translations: { create: translations } } });
  await audit(await auditContext(user), { module: "cms", action: id ? "page.updated" : "page.created", summary: `${id ? "Updated" : "Created"} page “${enTitle}” (${st})`, entityType: "Page", entityId: page.id });
  revalidatePublic();
  if (!id) redirect(localePath(await getLocale(), `/admin/content/pages/${page.id}`));
  return { ok: true };
}

export async function deletePageAction(form: FormData): Promise<void> {
  const user = await actor("cms:delete");
  const id = uuid(form, "id");
  if (!id) return;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page || page.kind !== "CUSTOM") return;
  await prisma.page.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED", updatedById: user.id } });
  await audit(await auditContext(user), { module: "cms", action: "page.deleted", summary: `Archived page /${page.slug}`, entityType: "Page", entityId: id });
  revalidatePublic();
  redirect(localePath(await getLocale(), "/admin/content/pages"));
}

// ---------------------------------------------------------------------------
// Clinics & doctors
// ---------------------------------------------------------------------------

export async function saveClinicAction(_: ActionState, form: FormData): Promise<ActionState> {
  const id = uuid(form, "id");
  const user = await actor(id ? "cms:edit" : "cms:create");
  const tr = readTranslations(form, ["name", "timings", "about"], ["about"]);
  if (!tr.en?.name) return { ok: false, error: "English name is required", fieldErrors: { "tr.en.name": "Required" } };
  const enName = tr.en.name;
  const slug = await resolveSlug("clinic", form, enName, id ?? undefined);
  if (typeof slug !== "string") return slug;
  const lat = str(form, "latitude");
  const lng = str(form, "longitude");
  const data = {
    slug,
    isPrimary: bool(form, "isPrimary"),
    active: bool(form, "active"),
    sortOrder: int(form, "sortOrder"),
    phone: opt(form, "phone"),
    whatsapp: opt(form, "whatsapp"),
    email: opt(form, "email"),
    addressLine: opt(form, "addressLine"),
    city: opt(form, "city"),
    state: opt(form, "state"),
    pincode: opt(form, "pincode"),
    latitude: lat ? Number(lat) : null,
    longitude: lng ? Number(lng) : null,
    mapsUrl: opt(form, "mapsUrl"),
    imageId: uuid(form, "imageId"),
  };
  const translations = Object.entries(tr).map(([locale, t]) => ({ locale: locale as Locale, name: t.name || enName, timings: t.timings || null, about: t.about || null }));
  const clinic = await prisma.$transaction(async (tx) => {
    if (data.isPrimary) await tx.clinic.updateMany({ where: id ? { NOT: { id } } : {}, data: { isPrimary: false } });
    if (id) {
      const c = await tx.clinic.update({ where: { id }, data });
      await tx.clinicTranslation.deleteMany({ where: { clinicId: id, locale: { notIn: translations.map((t) => t.locale) } } });
      for (const t of translations) await tx.clinicTranslation.upsert({ where: { clinicId_locale: { clinicId: id, locale: t.locale } }, create: { clinicId: id, ...t }, update: t });
      return c;
    }
    return tx.clinic.create({ data: { ...data, translations: { create: translations } } });
  });
  await audit(await auditContext(user), { module: "cms", action: id ? "clinic.updated" : "clinic.created", summary: `${id ? "Updated" : "Created"} clinic “${enName}”`, entityType: "Clinic", entityId: clinic.id });
  revalidatePublic();
  if (!id) redirect(localePath(await getLocale(), `/admin/content/clinics/${clinic.id}`));
  return { ok: true };
}

export async function deleteClinicAction(form: FormData): Promise<void> {
  const user = await actor("cms:delete");
  const id = uuid(form, "id");
  if (!id) return;
  await prisma.clinic.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  await audit(await auditContext(user), { module: "cms", action: "clinic.deleted", summary: "Archived clinic", entityType: "Clinic", entityId: id });
  revalidatePublic();
  redirect(localePath(await getLocale(), "/admin/content/clinics"));
}

export async function saveDoctorAction(_: ActionState, form: FormData): Promise<ActionState> {
  const id = uuid(form, "id");
  const user = await actor(id ? "cms:edit" : "cms:create");
  const tr = readTranslations(form, ["name", "qualifications", "specialities", "timings", "bio"], ["bio"]);
  if (!tr.en?.name) return { ok: false, error: "English name is required", fieldErrors: { "tr.en.name": "Required" } };
  const enName = tr.en.name;
  const slug = await resolveSlug("doctor", form, enName, id ?? undefined);
  if (typeof slug !== "string") return slug;
  const data = {
    slug,
    clinicId: uuid(form, "clinicId"),
    photoId: uuid(form, "photoId"),
    registrationNo: opt(form, "registrationNo"),
    email: opt(form, "email"),
    phone: opt(form, "phone"),
    active: bool(form, "active"),
    sortOrder: int(form, "sortOrder"),
  };
  const translations = Object.entries(tr).map(([locale, t]) => ({
    locale: locale as Locale,
    name: t.name || enName,
    qualifications: t.qualifications || null,
    specialities: t.specialities || null,
    timings: t.timings || null,
    bio: t.bio || null,
  }));
  const doctor = id
    ? await prisma.$transaction(async (tx) => {
        const d = await tx.doctor.update({ where: { id }, data });
        await tx.doctorTranslation.deleteMany({ where: { doctorId: id, locale: { notIn: translations.map((t) => t.locale) } } });
        for (const t of translations) await tx.doctorTranslation.upsert({ where: { doctorId_locale: { doctorId: id, locale: t.locale } }, create: { doctorId: id, ...t }, update: t });
        return d;
      })
    : await prisma.doctor.create({ data: { ...data, translations: { create: translations } } });
  await audit(await auditContext(user), { module: "cms", action: id ? "doctor.updated" : "doctor.created", summary: `${id ? "Updated" : "Created"} doctor profile “${enName}”`, entityType: "Doctor", entityId: doctor.id });
  revalidatePublic();
  if (!id) redirect(localePath(await getLocale(), `/admin/content/doctors/${doctor.id}`));
  return { ok: true };
}

export async function deleteDoctorAction(form: FormData): Promise<void> {
  const user = await actor("cms:delete");
  const id = uuid(form, "id");
  if (!id) return;
  await prisma.doctor.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  await audit(await auditContext(user), { module: "cms", action: "doctor.deleted", summary: "Archived doctor profile", entityType: "Doctor", entityId: id });
  revalidatePublic();
  redirect(localePath(await getLocale(), "/admin/content/doctors"));
}

// ---------------------------------------------------------------------------
// Generations gallery
// ---------------------------------------------------------------------------

export async function saveGenerationAction(_: ActionState, form: FormData): Promise<ActionState> {
  const id = uuid(form, "id");
  const user = await actor(id ? "cms:edit" : "cms:create");
  const tr = readTranslations(form, ["name", "title", "bio"], ["bio"]);
  if (!tr.en?.name) return { ok: false, error: "English name is required", fieldErrors: { "tr.en.name": "Required" } };
  const enName = tr.en.name;
  const data = {
    sortOrder: int(form, "sortOrder"),
    yearFrom: str(form, "yearFrom") ? int(form, "yearFrom") : null,
    yearTo: str(form, "yearTo") ? int(form, "yearTo") : null,
    photoId: uuid(form, "photoId"),
    status: status(form),
  };
  const translations = Object.entries(tr).map(([locale, t]) => ({ locale: locale as Locale, name: t.name || enName, title: t.title || null, bio: t.bio || null }));
  const gen = id
    ? await prisma.$transaction(async (tx) => {
        const g = await tx.generation.update({ where: { id }, data });
        await tx.generationTranslation.deleteMany({ where: { generationId: id, locale: { notIn: translations.map((t) => t.locale) } } });
        for (const t of translations) await tx.generationTranslation.upsert({ where: { generationId_locale: { generationId: id, locale: t.locale } }, create: { generationId: id, ...t }, update: t });
        return g;
      })
    : await prisma.generation.create({ data: { ...data, translations: { create: translations } } });
  await audit(await auditContext(user), { module: "cms", action: id ? "generation.updated" : "generation.created", summary: `${id ? "Updated" : "Added"} generation “${enName}”`, entityType: "Generation", entityId: gen.id });
  revalidatePublic();
  if (!id) redirect(localePath(await getLocale(), `/admin/content/generations/${gen.id}`));
  return { ok: true };
}

export async function deleteGenerationAction(form: FormData): Promise<void> {
  const user = await actor("cms:delete");
  const id = uuid(form, "id");
  if (!id) return;
  await prisma.generation.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  await audit(await auditContext(user), { module: "cms", action: "generation.deleted", summary: "Removed generation entry", entityType: "Generation", entityId: id });
  revalidatePublic();
  redirect(localePath(await getLocale(), "/admin/content/generations"));
}

// ---------------------------------------------------------------------------
// Contact inbox
// ---------------------------------------------------------------------------

const CONTACT_STATUSES: ContactStatus[] = ["NEW", "READ", "REPLIED", "SPAM"];

export async function setContactStatusAction(form: FormData): Promise<void> {
  const user = await actor("support:reply");
  const id = uuid(form, "id");
  const st = CONTACT_STATUSES.find((s) => s === str(form, "status"));
  if (!id || !st) return;
  await prisma.contactMessage.update({ where: { id }, data: { status: st, handledById: user.id, handledAt: new Date() } });
  await audit(await auditContext(user), { module: "support", action: "contact.status", summary: `Contact message marked ${st}`, entityType: "ContactMessage", entityId: id });
  revalidatePath("/[locale]/admin/content/inbox", "page");
}
