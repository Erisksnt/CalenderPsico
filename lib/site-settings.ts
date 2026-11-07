import { Prisma } from '@prisma/client';
import prisma from './database';
import { SiteSettingsSchema } from './validators';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from './site-settings-types';

const HOME_CONTENT_ID = 'home';
const SITE_CONTENT_REVISION_LIMIT = 10;

export * from './site-settings-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  if (value === null) {
    throw new TypeError('O conteúdo do site não pode conter null na raiz de valores JSON.');
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => item === null ? null : toPrismaJson(item));
  }
  if (isRecord(value)) {
    const jsonObject = Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        item === null ? null : toPrismaJson(item),
      ]),
    );
    return jsonObject as Prisma.InputJsonObject;
  }
  throw new TypeError('O conteúdo do site contém um valor que não pode ser serializado como JSON.');
}

function mergeSettings(base: unknown, override: unknown): unknown {
  if (Array.isArray(override)) return override;
  if (!isRecord(base) || !isRecord(override)) {
    return override === undefined ? base : override;
  }

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = key in base ? mergeSettings(base[key], value) : value;
  }
  return merged;
}

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const merged = mergeSettings(DEFAULT_SITE_SETTINGS, value);
  if (isRecord(merged) && Array.isArray(merged.navigation) && merged.navigation.length === 0) {
    merged.navigation = DEFAULT_SITE_SETTINGS.navigation.map((item) => ({ ...item }));
  }
  return SiteSettingsSchema.parse(merged);
}

export async function getPublishedSiteSettings(): Promise<SiteSettings> {
  const content = await prisma.siteContent.findUnique({
    where: { id: HOME_CONTENT_ID },
    select: { published_json: true },
  });

  if (!content) {
    throw new Error('Conteúdo inicial não importado. Execute a migração de conteúdo do site.');
  }

  return normalizeSiteSettings(content.published_json);
}

export async function getAdminSiteSettings() {
  const content = await prisma.siteContent.findUnique({
    where: { id: HOME_CONTENT_ID },
    select: {
      draft_json: true,
      published_json: true,
      published_at: true,
      version: true,
    },
  });

  if (!content) {
    throw new Error('Conteúdo inicial não importado. Execute a migração de conteúdo do site.');
  }

  const draft = normalizeSiteSettings(content.draft_json);
  const published = normalizeSiteSettings(content.published_json);

  return {
    draft,
    published,
    publishedAt: content.published_at,
    version: content.version,
    hasUnpublishedChanges: JSON.stringify(draft) !== JSON.stringify(published),
  };
}

export async function saveDraftSiteSettings(value: unknown): Promise<SiteSettings> {
  const settings = normalizeSiteSettings(value);
  const existing = await prisma.siteContent.findUnique({
    where: { id: HOME_CONTENT_ID },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('Conteúdo inicial não importado. Execute a migração de conteúdo do site.');
  }

  await prisma.siteContent.update({
    where: { id: HOME_CONTENT_ID },
    data: { draft_json: toPrismaJson(settings) },
  });

  return settings;
}

export async function publishDraftSiteSettings() {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.siteContent.findUnique({
      where: { id: HOME_CONTENT_ID },
    });

    if (!current) {
      throw new Error('Conteúdo inicial não importado. Execute a migração de conteúdo do site.');
    }

    const nextVersion = current.version + 1;
    const draft = normalizeSiteSettings(current.draft_json);
    await transaction.siteContentRevision.create({
      data: {
        content_id: HOME_CONTENT_ID,
        version: nextVersion,
        action: 'publish',
        snapshot: toPrismaJson(draft),
      },
    });

    const expiredRevisions = await transaction.siteContentRevision.findMany({
      where: { content_id: HOME_CONTENT_ID },
      orderBy: { version: 'desc' },
      skip: SITE_CONTENT_REVISION_LIMIT,
      select: { id: true },
    });

    if (expiredRevisions.length > 0) {
      await transaction.siteContentRevision.deleteMany({
        where: {
          content_id: HOME_CONTENT_ID,
          id: { in: expiredRevisions.map(({ id }) => id) },
        },
      });
    }

    const updated = await transaction.siteContent.update({
      where: { id: HOME_CONTENT_ID },
      data: {
        published_json: toPrismaJson(draft),
        version: nextVersion,
        published_at: new Date(),
      },
      select: {
        published_json: true,
        published_at: true,
        version: true,
      },
    });

    return {
      settings: normalizeSiteSettings(updated.published_json),
      publishedAt: updated.published_at,
      version: updated.version,
    };
  });
}

export async function discardDraftSiteSettings(): Promise<SiteSettings> {
  const current = await prisma.siteContent.findUnique({
    where: { id: HOME_CONTENT_ID },
    select: { published_json: true },
  });

  if (!current) {
    throw new Error('Conteúdo inicial não importado. Execute a migração de conteúdo do site.');
  }

  await prisma.siteContent.update({
    where: { id: HOME_CONTENT_ID },
    data: { draft_json: toPrismaJson(normalizeSiteSettings(current.published_json)) },
  });

  return normalizeSiteSettings(current.published_json);
}

export async function getSiteContentRevisions() {
  return prisma.siteContentRevision.findMany({
    where: { content_id: HOME_CONTENT_ID },
    orderBy: { version: 'desc' },
    take: SITE_CONTENT_REVISION_LIMIT,
    select: { id: true, version: true, action: true, created_at: true },
  });
}

export async function deleteSiteContentRevision(revisionId: string): Promise<boolean> {
  const result = await prisma.siteContentRevision.deleteMany({
    where: { id: revisionId, content_id: HOME_CONTENT_ID },
  });

  return result.count > 0;
}

export async function restoreSiteContentRevision(revisionId: string): Promise<SiteSettings> {
  const revision = await prisma.siteContentRevision.findFirst({
    where: { id: revisionId, content_id: HOME_CONTENT_ID },
    select: { snapshot: true },
  });

  if (!revision) {
    throw new Error('Versão de conteúdo não encontrada.');
  }

  return saveDraftSiteSettings(revision.snapshot);
}
