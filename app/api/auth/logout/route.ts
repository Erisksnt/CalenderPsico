// app/api/auth/logout/route.ts
// Endpoint para fazer logout

import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token não encontrado',
        },
        { status: 401 }
      );
    }

    // Faz logout no Supabase
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao fazer logout',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logout realizado com sucesso!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
