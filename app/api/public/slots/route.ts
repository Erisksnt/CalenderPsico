import { NextResponse } from 'next/server';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { getTodayISO, getAvailableSlots, getEnabledWeekdays } from '@/lib/scheduling';
import { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';

export async function GET(request: Request) {
  try {
    await ensureDefaultAdmin();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 });
    }

    if (date < getTodayISO()) {
      return NextResponse.json(
        { error: 'Não é possível visualizar horários para datas passadas.' },
        { status: 400 }
      );
    }

    const [slots, enabledWeekdays] = await Promise.all([
      getAvailableSlots(date),
      getEnabledWeekdays()
    ]);

    return NextResponse.json({ date, slots, enabledWeekdays });

  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return createDatabaseUnavailableResponse();
    }

    console.error('Erro ao carregar slots públicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}