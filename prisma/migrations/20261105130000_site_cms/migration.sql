CREATE TABLE "site_content" (
    "id" TEXT NOT NULL DEFAULT 'home',
    "draft_json" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "published_json" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "version" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "site_content_revisions" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_content_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "alt_text" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "site_content_revisions_content_id_version_key"
    ON "site_content_revisions"("content_id", "version");
CREATE INDEX "site_content_revisions_content_id_created_at_idx"
    ON "site_content_revisions"("content_id", "created_at");
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");
CREATE UNIQUE INDEX "media_assets_public_url_key" ON "media_assets"("public_url");
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");

ALTER TABLE "site_content_revisions"
    ADD CONSTRAINT "site_content_revisions_content_id_fkey"
    FOREIGN KEY ("content_id") REFERENCES "site_content"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
