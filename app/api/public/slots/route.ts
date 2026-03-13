import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/scheduling';

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 });
  }

  if (date < getTodayISO()) {
    return NextResponse.json({ error: 'Não é possível visualizar horários para datas passadas.' }, { status: 400 });
  }

  const slots = await getAvailableSlots(date);
  return NextResponse.json({ date, slots });
}
