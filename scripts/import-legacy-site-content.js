require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();
const bucketName = process.env.SITE_MEDIA_BUCKET || 'site-media';
const extensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const uploadedKeys = [];

const pendingAssets = [];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function moveEmbeddedImageToStorage(client, field, altText) {
  const dataUrl = field();
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return dataUrl || '';

  const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('Uma imagem existente possui formato inválido.');

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.byteLength > 5 * 1024 * 1024) {
    throw new Error('Uma imagem existente excede o limite de 5 MB.');
  }
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(buffer);
  const extension = detected?.mime ? extensions[detected.mime] : undefined;
  if (!detected || !extension) throw new Error('Uma imagem existente não é JPG, PNG ou WEBP.');

  const key = `site/${randomUUID()}.${extension}`;
  const { error } = await client.storage.from(bucketName).upload(key, buffer, {
    contentType: detected.mime,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`Não foi possível migrar uma imagem: ${error.message}`);
  uploadedKeys.push(key);

  const { data } = client.storage.from(bucketName).getPublicUrl(key);
  pendingAssets.push({
    id: randomUUID(),
    storage_key: key,
    public_url: data.publicUrl,
    mime_type: detected.mime,
    byte_size: buffer.byteLength,
    alt_text: altText || '',
  });
  return data.publicUrl;
}

async function main() {
  const sourcePath = path.join(process.cwd(), 'data', 'site-settings.json');
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Arquivo legado data/site-settings.json não encontrado.');
  }

  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  if (!isRecord(source) || !isRecord(source.hero) || !isRecord(source.about)) {
    throw new Error('O conteúdo legado possui formato inválido.');
  }

  const existing = await prisma.siteContent.findUnique({ where: { id: 'home' } });
  if (existing) {
    console.log('O conteúdo do CMS já existe; nenhum dado foi sobrescrito.');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasEmbeddedImages = [source.hero?.photo_url, source.about?.photo_url]
    .some((value) => typeof value === 'string' && value.startsWith('data:image/'));

  if (hasEmbeddedImages && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error(
      'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para migrar as imagens existentes.',
    );
  }

  const settings = {
    ...source,
    hero: { ...source.hero },
    about: { ...source.about },
  };
  if (hasEmbeddedImages) {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
    if (bucketsError) {
      throw new Error(`Não foi possível verificar o bucket do Supabase Storage: ${bucketsError.message}`);
    }
    const bucket = buckets?.find((item) => item.name === bucketName);
    if (!bucket) {
      throw new Error(`O bucket público "${bucketName}" não existe no Supabase Storage.`);
    }
    if (!bucket.public) {
      throw new Error(`O bucket "${bucketName}" precisa ser público para servir as imagens do site.`);
    }

    settings.hero.photo_url = await moveEmbeddedImageToStorage(
      client,
      () => settings.hero.photo_url,
      settings.hero.photo_alt,
    );
    settings.about.photo_url = await moveEmbeddedImageToStorage(
      client,
      () => settings.about.photo_url,
      settings.about.photo_alt,
    );
  }

  await prisma.$transaction(async (transaction) => {
    if (pendingAssets.length > 0) {
      await transaction.mediaAsset.createMany({ data: pendingAssets });
    }
    await transaction.siteContent.create({
      data: {
        id: 'home',
        draft_json: settings,
        published_json: settings,
        version: 1,
        published_at: new Date(),
      },
    });
    await transaction.siteContentRevision.create({
      data: {
        content_id: 'home',
        version: 1,
        action: 'initial-import',
        snapshot: settings,
      },
    });
  });

  console.log('Conteúdo legado importado como versão publicada inicial.');
}

main()
  .catch(async (error) => {
    console.error('Falha ao importar conteúdo legado:', error);
    if (uploadedKeys.length > 0) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey) {
        try {
          const client = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { error: cleanupError } = await client.storage
            .from(bucketName)
            .remove(uploadedKeys);
          if (cleanupError) {
            console.error('Falha ao limpar mídias da importação incompleta:', cleanupError.message);
          }
        } catch (cleanupError) {
          console.error('Falha ao limpar mídias da importação incompleta:', cleanupError);
        }
      }
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
