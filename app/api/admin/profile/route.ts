import { NextResponse } from 'next/server';
import prisma, { createDatabaseUnavailableResponse, isDatabaseConnectionError } from '@/lib/database';
import { getAdminFromRequest } from '@/lib/auth';
import { ProfileSchema } from '@/lib/validators';
import { fileTypeFromBuffer } from 'file-type';

export const dynamic = 'force-dynamic';

// 🔥 FUNÇÃO DE VALIDAÇÃO DE IMAGEM
async function validateImage(base64String: string): Promise<{ valid: boolean; error?: string }> {
  // Verifica se é base64 válido de imagem
  if (!base64String.startsWith('data:image/')) {
    return { valid: false, error: 'Formato de imagem inválido' };
  }

  // Extrai os dados base64 (remove o prefixo "data:image/xxx;base64,")
  const base64Data = base64String.split(',')[1];
  if (!base64Data) {
    return { valid: false, error: 'Dados de imagem inválidos' };
  }

  // Converte para buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // 🔥 TAMANHO MÁXIMO: 5MB (suficiente para fotos de celular)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (buffer.length > MAX_SIZE) {
    return { valid: false, error: `Imagem muito grande. Máximo 5MB. Tente reduzir a resolução.` };
  }

  // Detecta o tipo real do arquivo
  const fileType = await fileTypeFromBuffer(buffer);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (!fileType || !allowedTypes.includes(fileType.mime)) {
    return { valid: false, error: 'Apenas imagens JPG, PNG ou WEBP são permitidas' };
  }

  return { valid: true };
}

export async function GET(request: Request) {
  console.time("GET /profile total");

  try {
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
  console.time("PUT /profile total");
  
  try {
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

    // 🔥 VALIDAR IMAGEM SE HOUVER
    const photoUrl = parsed.data.photo_url;
    if (photoUrl && photoUrl.startsWith('data:image/')) {
      const validation = await validateImage(photoUrl);
      if (!validation.valid) {
        console.timeEnd("PUT /profile total");
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
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