import { Prisma, PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

declare global {
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
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
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

export function createDatabaseUnavailableResponse() {
  return NextResponse.json(
    {
      error:
        'Banco de dados indisponível. Inicie o PostgreSQL e rode `npm run db:push` e `npm run db:seed` antes de tentar novamente.',
    },
    { status: 503 },
  );
}

// legacy compatibility helpers for unused legacy routes
export async function getOrCreatePatient() {
  return null;
}

export async function createAuditLog() {
  return null;
}
