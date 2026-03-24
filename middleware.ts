import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  // Só aplica rate limit em rotas de API
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // DETECÇÃO DE IP
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') ||
    request.ip ||
    '127.0.0.1';

  try {
    const { success, limit, reset, remaining } = await apiRateLimit.limit(ip);

    const response = NextResponse.next();

    // Headers informativos
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toString());        
  
    if (!success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Muitas requisições. Tente novamente mais tarde.',
          limit,
          remaining,
          reset: new Date(reset).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    return response;
  } catch (error) {
    console.error('Erro no rate limit:', error);
    // Se falhar, deixa passar (fail open)
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',
};