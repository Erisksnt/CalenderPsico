import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
// ✅ JÁ REMOVIDO: import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { ProfileSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.time("GET /profile total");

  try {
    // ✅ JÁ REMOVIDO: await ensureDefaultAdmin();

    console.time("getAdminFromRequest");
    const admin = await getAdminFromRequest(request);
    console.timeEnd("getAdminFromRequest");

    if (!admin) {
      console.timeEnd("GET /profile total");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.time("prisma profile.findUnique");
    const profile = await prisma.profile.findUnique({ 
      where: { user_id: admin.id },
      select: {
        id: true,
        user_id: true,
        full_name: true,
        professional_bio: true,
        work_method: true,
        specialties: true,
        photo_url: true,
        updated_at: true
      }
    });
    console.timeEnd("prisma profile.findUnique");

    console.timeEnd("GET /profile total");
    return NextResponse.json(profile);
  } catch (error) {
    console.timeEnd("GET /profile total");

    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao carregar perfil do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  console.time("PUT /profile total"); // Opcional: adicionar timer
  
  try {
    // ✅ JÁ REMOVIDO: await ensureDefaultAdmin();
    
    console.time("getAdminFromRequest PUT");
    const admin = await getAdminFromRequest(request);
    console.timeEnd("getAdminFromRequest PUT");
    
    if (!admin) {
      console.timeEnd("PUT /profile total");
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      console.timeEnd("PUT /profile total");
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    console.time("prisma profile.upsert");
    const profile = await prisma.profile.upsert({
      where: { user_id: admin.id },
      create: { 
        user_id: admin.id, 
        ...parsed.data, 
        photo_url: parsed.data.photo_url || null 
      },
      update: { 
        ...parsed.data, 
        photo_url: parsed.data.photo_url || null 
      },
      // ⚡ ADICIONAR select para retornar apenas campos necessários
      select: {
        id: true,
        user_id: true,
        full_name: true,
        professional_bio: true,
        work_method: true,
        specialties: true,
        photo_url: true,
        updated_at: true
      }
    });
    console.timeEnd("prisma profile.upsert");

    console.timeEnd("PUT /profile total");
    return NextResponse.json(profile);
  } catch (error) {
    console.timeEnd("PUT /profile total");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }
    console.error('Erro ao salvar perfil do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}