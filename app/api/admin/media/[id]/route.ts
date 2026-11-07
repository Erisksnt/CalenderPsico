import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { getMediaStorage, StorageConfigurationError } from '@/lib/supabase/media-storage';
import { getAdminSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isUsed(value: unknown, url: string): boolean {
  if (typeof value === 'string') return value === url;
  if (Array.isArray(value)) return value.some((entry) => isUsed(entry, url));
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some((entry) => isUsed(entry, url));
  }
  return false;
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const [asset, settings] = await Promise.all([
      prisma.mediaAsset.findUnique({ where: { id: params.id } }),
      getAdminSiteSettings(),
    ]);

    if (!asset) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });

    if (
      isUsed(settings.draft, asset.public_url) ||
      isUsed(settings.published, asset.public_url)
    ) {
      return NextResponse.json(
        { error: 'Esta imagem está sendo usada no rascunho ou no site publicado.' },
        { status: 409 },
      );
    }

    const { client, bucket } = getMediaStorage();
    const { error } = await client.storage.from(bucket).remove([asset.storage_key]);
    if (error) throw new Error(`Falha ao remover arquivo do storage: ${error.message}`);

    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover mídia:', error);
    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Não foi possível remover a imagem.' }, { status: 500 });
  }
}
