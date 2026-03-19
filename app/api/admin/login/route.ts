import { NextResponse } from 'next/server';
import { AdminLoginSchema } from '@/lib/validators';
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
      
      // 🔥 CORREÇÃO: Pegar o primeiro erro de forma legível
      const errors = parsed.error.flatten();
      const firstError = 
        errors.fieldErrors.email?.[0] || 
        errors.fieldErrors.password?.[0] || 
        'Dados inválidos';
      
      return NextResponse.json(
        { error: firstError },  // ← AGORA É UMA STRING!
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    
    console.time("findUser");
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        psychologist: {
          select: { id: true }
        },
        profile: {
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
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: 'ADMIN',
      psychologistId: user.psychologist?.id,
      userName: user.profile?.full_name,
      userProfile: user.profile ? {
        id: user.profile.id,
        full_name: user.profile.full_name,
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
          name: user.profile?.full_name,
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