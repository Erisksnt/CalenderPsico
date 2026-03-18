import { NextResponse } from 'next/server';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { getAvailableSlots, getEnabledWeekdays } from '@/lib/scheduling';

function getTodayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    await ensureDefaultAdmin();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 });
    }

    if (date < getTodayISO()) {
      return NextResponse.json({ error: 'Não é possível visualizar horários para datas passadas.' }, { status: 400 });
    }

    const [slots, enabledWeekdays] = await Promise.all([getAvailableSlots(date), getEnabledWeekdays()]);
    return NextResponse.json({ date, slots, enabledWeekdays });
  } catch (error) {
    console.error('Erro ao carregar slots públicos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
