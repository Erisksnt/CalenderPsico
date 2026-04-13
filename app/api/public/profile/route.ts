export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma, {
  createDatabaseUnavailableResponse,
  isDatabaseConnectionError,
} from '@/lib/database';
// 🔥 REMOVER: import { ensureDefaultAdmin, getPrimaryPsychologist } from '@/lib/bootstrap';

export async function GET() {
  console.time("GET /api/public/profile");
  
  try {
    // 🔥 REMOVER: await ensureDefaultAdmin();

    // ⚡ Buscar o psicólogo principal com perfil em UMA ÚNICA QUERY
    console.time("findPsychologistWithProfile");
    const psychologist = await prisma.psychologist.findFirst({
      where: {
        user: {
          profile: {
            isNot: null  // Só retorna se tiver perfil
          }
        }
      },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        user: {
          select: {
            profile: {
              select: {
                // ⚡ Campos públicos do perfil
                id: true,
                full_name: true,
                professional_bio: true,
                work_method: true,
                specialties: true,
                photo_url: true,
                updated_at: true
                // ❌ NÃO incluir: email, phone, etc. (dados sensíveis)
              }
            }
          }
        }
      }
    });
    console.timeEnd("findPsychologistWithProfile");

    if (!psychologist?.user?.profile) {
      console.timeEnd("GET /api/public/profile");
      return NextResponse.json(null, { status: 404 });
    }

    console.timeEnd("GET /api/public/profile");

    return NextResponse.json({
      id: psychologist.id,
      full_name: psychologist.user.profile.full_name,
      professional_bio: psychologist.user.profile.professional_bio,
      work_method: psychologist.user.profile.work_method,
      specialties: psychologist.user.profile.specialties,
      photo_url: psychologist.user.profile.photo_url,
      updated_at: psychologist.user.profile.updated_at,
    });
  } catch (error) {
    console.timeEnd("GET /api/public/psychologist/profile");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao carregar perfil público:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}