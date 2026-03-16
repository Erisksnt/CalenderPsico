// app/api/psychologists/route.ts
// GET: Listar psicólogos públicos

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

// GET /api/psychologists
export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { full_name: 'asc' },
    });

    const psychologists = profiles.map((profile) => ({
      id: profile.id,
      user_id: profile.user_id,
      name: profile.full_name,
      bio: profile.professional_bio,
      specialties: profile.specialties,
      services: [],
      availabilities: [],
    }));

    return NextResponse.json({ success: true, data: psychologists }, { status: 200 });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao listar psicólogos:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
