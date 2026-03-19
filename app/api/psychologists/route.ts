// app/api/psychologists/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';

// GET /api/psychologists
export async function GET(req: NextRequest) {
  console.time("GET /api/psychologists");
  
  try {
    console.time("findPsychologists");
    const psychologists = await prisma.psychologist.findMany({
      select: {
        id: true,
        user: {
          select: {
            profile: {
              select: {
                full_name: true,
                professional_bio: true,
                photo_url: true,
                specialties: true
              }
            }
          }
        },
        // ✅ SÓ availabilities (que existe)
        availabilities: {
          select: {
            id: true,
            day_of_week: true,
            start_time: true,
            end_time: true,
            is_blocked: true
          },
          orderBy: { day_of_week: 'asc' }
        }
      },
      orderBy: {
        user: {
          profile: {
            full_name: 'asc'
          }
        }
      }
    });
    console.timeEnd("findPsychologists");

    const formattedPsychologists = psychologists.map(p => ({
      id: p.id,
      name: p.user?.profile?.full_name || 'Nome não informado',
      bio: p.user?.profile?.professional_bio || '',
      photo_url: p.user?.profile?.photo_url || null,
      specialties: p.user?.profile?.specialties || [],
      // ✅ SEM services
      availabilities: p.availabilities || []
    }));

    console.timeEnd("GET /api/psychologists");
    return NextResponse.json(
      { success: true, data: formattedPsychologists },
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