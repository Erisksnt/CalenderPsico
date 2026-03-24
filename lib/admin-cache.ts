// lib/admin-cache.ts
interface CacheEntry {
  data: any;
  timestamp: number;
}

// Cache para perfil do admin
const profileCache = new Map<string, CacheEntry>();
// Cache para disponibilidade
const availabilityCache = new Map<string, CacheEntry>();
// Cache para agendamentos
const appointmentsCache = new Map<string, CacheEntry>();

const CACHE_TTL = 30_000; // 30 segundos (curto para dados que podem mudar)

export function getCachedProfile(userId: string) {
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`⚡ Cache hit para perfil do admin ${userId}`);
    return cached.data;
  }
  return null;
}

export function setCachedProfile(userId: string, data: any) {
  profileCache.set(userId, { data, timestamp: Date.now() });
  console.log(`💾 Cache set para perfil do admin ${userId}`);
}

export function getCachedAvailability(psychologistId: string) {
  const cached = availabilityCache.get(psychologistId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`⚡ Cache hit para disponibilidade ${psychologistId}`);
    return cached.data;
  }
  return null;
}

export function setCachedAvailability(psychologistId: string, data: any) {
  availabilityCache.set(psychologistId, { data, timestamp: Date.now() });
  console.log(`💾 Cache set para disponibilidade ${psychologistId}`);
}

export function getCachedAppointments(psychologistId: string) {
  const cached = appointmentsCache.get(psychologistId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`⚡ Cache hit para agendamentos ${psychologistId}`);
    return cached.data;
  }
  return null;
}

export function setCachedAppointments(psychologistId: string, data: any) {
  appointmentsCache.set(psychologistId, { data, timestamp: Date.now() });
  console.log(`💾 Cache set para agendamentos ${psychologistId}`);
}

// Função para invalidar cache quando houver alteração
export function invalidateAdminCache(psychologistId: string | undefined, userId: string) {
  profileCache.delete(userId);
  if (psychologistId) {
    availabilityCache.delete(psychologistId);
    appointmentsCache.delete(psychologistId);
  }
  console.log(`🗑️ Cache invalidado para psicólogo ${psychologistId || 'N/A'}, usuário ${userId}`);
}