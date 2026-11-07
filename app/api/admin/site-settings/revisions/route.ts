import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import {
  deleteSiteContentRevision,
  getSiteContentRevisions,
  restoreSiteContentRevision,
} from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    return NextResponse.json(await getSiteContentRevisions(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Erro ao carregar versões do site:', error);
    return NextResponse.json({ error: 'Não foi possível carregar as versões.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body: unknown = await request.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('revisionId' in body) ||
      typeof body.revisionId !== 'string'
    ) {
      return NextResponse.json({ error: 'Versão inválida.' }, { status: 400 });
    }

    const settings = await restoreSiteContentRevision(body.revisionId);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Erro ao restaurar versão do site:', error);
    return NextResponse.json({ error: 'Não foi possível restaurar a versão.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Versão inválida.' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('revisionId' in body) ||
    typeof body.revisionId !== 'string' ||
    body.revisionId.trim().length === 0
  ) {
    return NextResponse.json({ error: 'Versão inválida.' }, { status: 400 });
  }

  try {
    const deleted = await deleteSiteContentRevision(body.revisionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Versão não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Erro ao excluir versão do site:', error);
    return NextResponse.json({ error: 'Não foi possível excluir a versão.' }, { status: 500 });
  }
}
