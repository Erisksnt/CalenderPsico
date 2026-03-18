import { NextResponse } from 'next/server';
// 🔥 REMOVER: import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { getTodayISO, getAvailableSlots, getEnabledWeekdays } from '@/lib/scheduling';
import { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';

export async function GET(request: Request) {
  console.time("GET /api/public/slots");
  
  try {
    // 🔥 REMOVER: await ensureDefaultAdmin();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      console.timeEnd("GET /api/public/slots");
      return NextResponse.json({ error: 'date é obrigatório' }, { status: 400 });
    }

    if (date < getTodayISO()) {
      console.timeEnd("GET /api/public/slots");
      return NextResponse.json(
        { error: 'Não é possível visualizar horários para datas passadas.' },
        { status: 400 }
      );
    }

    // ⚡ Buscar slots e dias disponíveis em paralelo (já está otimizado!)
    console.time("fetchSlots");
    const [slots, enabledWeekdays] = await Promise.all([
      getAvailableSlots(date),
      getEnabledWeekdays()
    ]);
    console.timeEnd("fetchSlots");

    console.timeEnd("GET /api/public/slots");
    return NextResponse.json({ date, slots, enabledWeekdays });

  } catch (error) {
    console.timeEnd("GET /api/public/slots");
    
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