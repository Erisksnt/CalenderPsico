// app/api/psychologists/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';

// GET /api/psychologists
export async function GET(req: NextRequest) {
  console.time("GET /api/psychologists");
  
  try {
    // ⚡ Buscar psicólogos com apenas os campos necessários
    console.time("findPsychologists");
    const psychologists = await prisma.psychologist.findMany({
      select: {
        id: true,
        name: true,
        bio: true,
        photo_url: true,
        // ⚡ Em vez de incluir TUDO, seleciona apenas campos específicos
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true
          }
        },
        availabilities: {
          select: {
            id: true,
            day_of_week: true,
            start_time: true,
            end_time: true,
            is_blocked: true
          },
          where: {
            // ⚡ Opcional: filtrar apenas disponibilidades ativas
            // is_blocked: false
          },
          orderBy: { day_of_week: 'asc' }
        }
      },
      orderBy: { name: 'asc' },
      // ⚡ Opcional: paginação se houver muitos psicólogos
      // take: 20,
      // skip: 0
    });
    console.timeEnd("findPsychologists");

    console.timeEnd("GET /api/psychologists");
    return NextResponse.json(
      {
        success: true,
        data: psychologists,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.timeEnd("GET /api/psychologists");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao listar psicólogos:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { debug: errorMessage }),
      },
      { status: 500 }
    );
  }
}