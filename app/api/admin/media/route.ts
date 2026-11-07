import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { getMediaStorage, StorageConfigurationError } from '@/lib/supabase/media-storage';
import { getAdminSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function getUsages(value: unknown, url: string, path = ''): string[] {
  if (typeof value === 'string') return value === url ? [path] : [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => getUsages(entry, url, `${path}[${index + 1}]`));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, entry]) =>
      getUsages(entry, url, path ? `${path}.${key}` : key),
    );
  }
  return [];
}

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const [assets, settings] = await Promise.all([
      prisma.mediaAsset.findMany({
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          public_url: true,
          mime_type: true,
          byte_size: true,
          alt_text: true,
          created_at: true,
        },
      }),
      getAdminSiteSettings(),
    ]);

    return NextResponse.json({
      assets: assets.map((asset) => ({
        ...asset,
        usedIn: [
          ...getUsages(settings.draft, asset.public_url).map((usage) => `Rascunho: ${usage}`),
          ...getUsages(settings.published, asset.public_url).map((usage) => `Publicado: ${usage}`),
        ],
      })),
    });
  } catch (error) {
    console.error('Erro ao carregar biblioteca de mídia:', error);
    return NextResponse.json({ error: 'Não foi possível carregar as mídias.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let uploadedKey: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const altText = formData.get('altText');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Selecione um arquivo de imagem.' }, { status: 400 });
    }

    if (file.size < 1 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'A imagem deve ter até 5 MB.' }, { status: 400 });
    }

    if (typeof altText !== 'string' || !altText.trim() || altText.trim().length > 300) {
      return NextResponse.json({ error: 'Informe um texto alternativo de até 300 caracteres.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = await fileTypeFromBuffer(buffer);
    const extension = detectedType?.mime ? EXTENSIONS[detectedType.mime] : undefined;
    if (!detectedType || !extension) {
      return NextResponse.json({ error: 'Formato não permitido. Use JPG, PNG ou WEBP.' }, { status: 400 });
    }

    const { client, bucket } = getMediaStorage();
    uploadedKey = `site/${randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(uploadedKey, buffer, {
        contentType: detectedType.mime,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) throw new Error(`Falha no storage: ${uploadError.message}`);

    const { data } = client.storage.from(bucket).getPublicUrl(uploadedKey);
    const asset = await prisma.mediaAsset.create({
      data: {
        storage_key: uploadedKey,
        public_url: data.publicUrl,
        mime_type: detectedType.mime,
        byte_size: buffer.byteLength,
        alt_text: altText.trim(),
      },
    });

    return NextResponse.json(
      {
        id: asset.id,
        url: asset.public_url,
        altText: asset.alt_text,
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedKey) {
      try {
        const { client, bucket } = getMediaStorage();
        const { error: removeError } = await client.storage.from(bucket).remove([uploadedKey]);
        if (removeError) console.error('Falha ao remover upload incompleto:', removeError);
      } catch (cleanupError) {
        console.error('Falha ao limpar upload incompleto:', cleanupError);
      }
    }

    console.error('Erro ao enviar mídia:', error);
    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Não foi possível enviar a imagem.' }, { status: 500 });
  }
}
