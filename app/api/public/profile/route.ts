import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function GET() {
  const profile = await prisma.profile.findFirst({
    orderBy: { created_at: 'asc' },
  });

  return NextResponse.json(profile);
}
