export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { ensureDefaultAdmin, getPrimaryPsychologist } from '@/lib/bootstrap';

export async function GET() {
  try {
    await ensureDefaultAdmin();
    const psychologist = await getPrimaryPsychologist();

    if (!psychologist?.user.profile) {
      return NextResponse.json(null, { status: 404 });
    }

    const profile = await prisma.profile.findUnique({ where: { user_id: psychologist.user_id } });
    return NextResponse.json(profile);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao carregar perfil público:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
