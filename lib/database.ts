import { existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

declare global {
  var prisma: PrismaClient | undefined;
  var prismaEnvLoaded: boolean | undefined;
}

function loadProjectEnv() {
  if (global.prismaEnvLoaded || process.env.NODE_ENV === 'production') {
    return;
  }

  const envPath = path.join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }

  global.prismaEnvLoaded = true;
}

function getPrismaInstance() {
  loadProjectEnv();

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

function getDatabaseHostLabel() {
  try {
    loadProjectEnv();
    if (!process.env.DATABASE_URL) return 'desconhecido';
    const url = new URL(process.env.DATABASE_URL);
    return `${url.hostname}:${url.port || '5432'}`;
  } catch {
    return 'desconhecido';
  }
}

export function createDatabaseUnavailableResponse() {
  const host = getDatabaseHostLabel();

  return NextResponse.json(
    {
      error:
        `Banco de dados indisponível em ${host}. Verifique se o mesmo DATABASE_URL usado no Prisma CLI também está sendo usado pelo Next.js e rode \`npm run db:push\` e \`npm run db:seed\` no banco correto.`,

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
