export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getTodayISO, getAvailableSlots, getEnabledWeekdays } from '@/lib/scheduling';
import { isDatabaseConnectionError, createDatabaseUnavailableResponse } from '@/lib/database';

// CACHE EM MEMÓRIA
interface CacheEntry {
  data: any;
  timestamp: number;
}

const slotCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60_000; // 1 minuto (60 segundos)

function getCachedSlots(date: string) {
  const cached = slotCache.get(date);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`⚡ Cache hit para data ${date}`);
    return cached.data;
  }
  return null;
}

function setCachedSlots(date: string, data: any) {
  slotCache.set(date, { data, timestamp: Date.now() });
  console.log(`💾 Cache set para data ${date}`);
}

export async function GET(request: Request) {
  console.time("GET /api/public/slots");
  
  try {
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

    // VERIFICAR CACHE PRIMEIRO
    const cached = getCachedSlots(date);
    if (cached) {
      console.timeEnd("GET /api/public/slots");
      return NextResponse.json(cached);
    }

    // Buscar slots e dias disponíveis em paralelo
    console.time("fetchSlots");
    const [slots, enabledWeekdays] = await Promise.all([
      getAvailableSlots(date),
      getEnabledWeekdays()
    ]);
    console.timeEnd("fetchSlots");

    const response = { date, slots, enabledWeekdays };

    // ARMAZENAR EM CACHE
    setCachedSlots(date, response);

    console.timeEnd("GET /api/public/slots");
    return NextResponse.json(response);

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