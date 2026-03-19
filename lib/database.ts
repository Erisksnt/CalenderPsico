import { Prisma, PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getPrismaInstance() {
  if (!global.prisma) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required to instantiate PrismaClient');
    }
    global.prisma = new PrismaClient();
  }

  return global.prisma;
}

const prismaProxy = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaInstance();
    const value = (client as unknown as Record<string, unknown>)[prop as string];

    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

export default prismaProxy;

export function isDatabaseConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.message.includes('DATABASE_URL is required') ||
      error.message.includes("Can't reach database server") ||
      error.message.includes('connect ECONNREFUSED')
    );
  }

  return false;
}

// 🔥 FUNÇÃO CORRIGIDA - extrai hostname sem usar URL()
function getDatabaseHostLabel() {
  try {
    if (!process.env.DATABASE_URL) return 'desconhecido';

    // Extrair hostname e porta manualmente da string postgresql://
    const match = process.env.DATABASE_URL.match(/@([^:/]+)(?::(\d+))?/);
    if (!match) return 'desconhecido';
    
    const hostname = match[1];
    const port = match[2] || '5432';
    
    return `${hostname}:${port}`;
  } catch {
    return 'desconhecido';
  }
}

export function createDatabaseUnavailableResponse() {
  const host = getDatabaseHostLabel();

  return NextResponse.json(
    {
      error: `Banco de dados indisponível em ${host}. Verifique sua conexão.`,
    },
    { status: 503 },
  );
}