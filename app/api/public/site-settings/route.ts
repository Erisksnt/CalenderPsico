import { NextResponse } from 'next/server';
import { getPublishedSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPublishedSiteSettings();
    return NextResponse.json(settings, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Erro ao carregar configurações públicas do site:', error);
    return NextResponse.json(
      { error: 'Não foi possível carregar as configurações do site.' },
      { status: 500 },
    );
  }
}
