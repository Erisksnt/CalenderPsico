// app/api/psychologists/route.ts
// GET: Listar psicólogos públicos

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';

// GET /api/psychologists
export async function GET(req: NextRequest) {
  try {
    const psychologists = await prisma.psychologist.findMany({
      include: {
        services: true,
        availabilities: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: psychologists,
      },
      { status: 200 }
    );
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
