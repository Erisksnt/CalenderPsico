import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/scheduling';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 });
  }

  const slots = await getAvailableSlots(date);
  return NextResponse.json({ date, slots });
}
