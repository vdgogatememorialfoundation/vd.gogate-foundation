-- CreateEnum
CREATE TYPE "NoticeKind" AS ENUM ('ANNOUNCEMENT', 'NOTICE', 'BANNER', 'FLYER');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'SPAM');

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "storage" VARCHAR(32) NOT NULL,
    "key" VARCHAR(512) NOT NULL,
    "url" VARCHAR(1024) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" VARCHAR(300),
    "folder" VARCHAR(64) NOT NULL DEFAULT 'general',
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_category_translations" (
    "categoryId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "article_category_translations_pkey" PRIMARY KEY ("categoryId","locale")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "authorName" VARCHAR(160),
    "categoryId" UUID,
    "coverMediaId" UUID,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_translations" (
    "articleId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "excerpt" VARCHAR(600),
    "body" TEXT NOT NULL,
    "metaTitle" VARCHAR(200),
    "metaDescription" VARCHAR(320),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_translations_pkey" PRIMARY KEY ("articleId","locale")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "kind" "NoticeKind" NOT NULL DEFAULT 'NOTICE',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "linkUrl" VARCHAR(1024),
    "imageId" UUID,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_translations" (
    "noticeId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT,

    CONSTRAINT "notice_translations_pkey" PRIMARY KEY ("noticeId","locale")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "email" VARCHAR(255),
    "addressLine" VARCHAR(400),
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "pincode" VARCHAR(10),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "mapsUrl" VARCHAR(1024),
    "imageId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_translations" (
    "clinicId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "timings" VARCHAR(400),
    "about" TEXT,

    CONSTRAINT "clinic_translations_pkey" PRIMARY KEY ("clinicId","locale")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "clinicId" UUID,
    "photoId" UUID,
    "registrationNo" VARCHAR(60),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_translations" (
    "doctorId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "qualifications" VARCHAR(300),
    "specialities" VARCHAR(300),
    "timings" VARCHAR(400),
    "bio" TEXT,

    CONSTRAINT "doctor_translations_pkey" PRIMARY KEY ("doctorId","locale")
);

-- CreateTable
CREATE TABLE "generations" (
    "id" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "photoId" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_translations" (
    "generationId" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "title" VARCHAR(200),
    "bio" TEXT,

    CONSTRAINT "generation_translations_pkey" PRIMARY KEY ("generationId","locale")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "subject" VARCHAR(200),
    "message" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "userId" UUID,
    "ip" VARCHAR(64),
    "handledById" UUID,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_key_key" ON "media"("key");

-- CreateIndex
CREATE INDEX "media_folder_createdAt_idx" ON "media"("folder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "article_categories_slug_key" ON "article_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_publishedAt_idx" ON "articles"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "notices_kind_status_startsAt_endsAt_idx" ON "notices"("kind", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinics_slug_key" ON "clinics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_slug_key" ON "doctors"("slug");

-- CreateIndex
CREATE INDEX "contact_messages_status_createdAt_idx" ON "contact_messages"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "article_category_translations" ADD CONSTRAINT "article_category_translations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "article_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "article_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_translations" ADD CONSTRAINT "notice_translations_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_translations" ADD CONSTRAINT "clinic_translations_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_translations" ADD CONSTRAINT "doctor_translations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_translations" ADD CONSTRAINT "generation_translations_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
