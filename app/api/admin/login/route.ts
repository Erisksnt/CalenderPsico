import { NextResponse } from 'next/server';
import { AdminLoginSchema } from '@/lib/validators';
// ✅ REMOVIDO: import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { verifyPassword, createToken, buildAuthCookie } from '@/lib/auth';
import { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';
import prisma from '@/lib/database';

export async function POST(request: Request) {
  console.time("POST /api/admin/login");
  
  try {
    const body = await request.json();
    const parsed = AdminLoginSchema.safeParse(body);

    if (!parsed.success) {
      console.timeEnd("POST /api/admin/login");
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // ✅ REMOVIDO: await ensureDefaultAdmin();

    const email = parsed.data.email.trim().toLowerCase();
    
    console.time("findUser");
    // ⚡ Buscar também o profile para incluir no token
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        psychologist: {
          select: { id: true }
        },
        profile: {  // ✅ Incluir profile!
          select: {
            id: true,
            full_name: true,
            photo_url: true
          }
        }
      },
    });
    console.timeEnd("findUser");

    if (!user || user.role !== 'ADMIN') {
      console.timeEnd("POST /api/admin/login");
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    console.time("verifyPassword");
    const passwordMatches = await verifyPassword(parsed.data.password, user.password_hash);
    console.timeEnd("verifyPassword");
    
    if (!passwordMatches) {
      console.timeEnd("POST /api/admin/login");
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    console.time("createToken");
    // ✅ AGORA com todos os dados no payload!
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: 'ADMIN',
      psychologistId: user.psychologist?.id,
      userName: user.profile?.full_name,
      userProfile: user.profile ? {
        id: user.profile.id,
        full_name: user.profile.full_name,
        //photo_url: user.profile.photo_url
      } : undefined
    });
    console.timeEnd("createToken");

    console.timeEnd("POST /api/admin/login");
    
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.profile?.full_name,  // ✅ Opcional: incluir na resposta
        },
      },
      {
        headers: {
          'Set-Cookie': buildAuthCookie(token),
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.timeEnd("POST /api/admin/login");
    
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro no login do admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}