/**
 * Idempotent seed: permission catalogue, system roles, bootstrap super admin,
 * default site settings and legal page placeholders.
 * Run: pnpm db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

const prisma = new PrismaClient();

// Source of truth for modules/actions/system roles.
import { MODULES, SYSTEM_ROLES } from "../../core/src/rbac/index.js";

function randomPublicId(): string {
  let s = String(randomInt(1, 10));
  while (s.length < 12) s += randomInt(0, 10);
  return s;
}

async function main() {
  // 1. Permission catalogue
  for (const [module, actions] of Object.entries(MODULES)) {
    for (const action of actions as readonly string[]) {
      await prisma.permission.upsert({ where: { module_action: { module, action } }, update: {}, create: { module, action } });
    }
  }
  const allPerms = await prisma.permission.findMany();
  const permId = new Map(allPerms.map((p) => [`${p.module}:${p.action}`, p.id]));

  // 2. System roles
  let order = 0;
  for (const [key, def] of Object.entries(SYSTEM_ROLES)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: def.name, isSystem: true, userKind: def.userKind, sortOrder: order },
      create: { key, name: def.name, isSystem: true, userKind: def.userKind, sortOrder: order },
    });
    order++;
    const perms = def.permissions === "*" ? [...permId.keys()] : [...def.permissions];
    // Only system-managed roles get their permission set reconciled on seed.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: permId.get(p)! })).filter((r) => r.permissionId),
      skipDuplicates: true,
    });
  }

  // 3. Bootstrap super admin
  const superAdmin = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } });
  const hasSuperAdmin = await prisma.userRole.count({ where: { roleId: superAdmin.id } });
  if (!hasSuperAdmin) {
    const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@vaidyagogate.org").toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "Admin@2026";
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        publicId: randomPublicId(),
        email,
        firstName: "Super",
        lastName: "Admin",
        kind: "STAFF",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: false,
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: superAdmin.id } });
    await prisma.auditLog.create({
      data: { actorType: "SYSTEM", module: "users", action: "user.created", entityType: "User", entityId: user.id, summary: `Bootstrap super admin ${user.publicId} created (${email})` },
    });
    console.log(`Bootstrap super admin: ${email} / User ID ${user.publicId}`);
  }

  // 4. Site settings
  const settings: Record<string, unknown> = {
    "branding.site_name": "Vaidya Gogate Memorial Foundation",
    "branding.logo_url": null,
    "branding.app_logo_url": null,
    "branding.primary_color": "#7c2d12",
    "locale.default": "en",
    "locale.enabled": ["en", "mr", "hi"],
    "contact.email": "vd.gogatememorialfoundation@gmail.com",
    "contact.phone": "",
    "contact.address": "",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value: value as never } });
  }

  // 5. Legal pages (drafts; admin fills content)
  const legal: [string, string][] = [
    ["terms-and-conditions", "Terms & Conditions"],
    ["privacy-policy", "Privacy Policy"],
    ["shipping-policy", "Shipping Policy"],
    ["payments-and-refunds-policy", "Payments & Refunds Policy"],
  ];
  for (const [slug, title] of legal) {
    await prisma.page.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        kind: "LEGAL",
        status: "DRAFT",
        translations: { create: [{ locale: "en", title, body: `<p>${title} — content to be added by the administrator.</p>` }] },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
