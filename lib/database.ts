import { PrismaClient } from '@prisma/client';

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

// legacy compatibility helpers for unused legacy routes
export async function getOrCreatePatient() {
  return null;
}

export async function createAuditLog() {
  return null;
}
