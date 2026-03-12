// lib/utils.ts
// Funções utilitárias do sistema

import { format, addMinutes, parse, parseISO, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Formata data e hora (DD/MM/YYYY HH:mm)
 */
export function formatDateTimeBR(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return 'Data/hora inválida';
  }
}

/**
 * Formata apenas as horas (HH:mm)
 */
export function formatTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
  } catch {
    return 'Hora inválida';
  }
}

/**
 * Formata um valor em reais (centavos para R$)
 */
export function formatCurrency(cents: number): string {
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Gera slots de horário disponível entre duas horas
 */
export function generateTimeSlots(
  startTimeStr: string,
  endTimeStr: string,
  durationMinutes: number = 60
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    currentMinutes += durationMinutes;
  }

  return slots;
}

/**
 * Calcula a hora de término baseado na hora de início e duração
 */
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  return addMinutes(startTime, durationMinutes);
}

/**
 * Valida se um horário não sobrepoede outro
 */
export function hasTimeConflict(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Converte string HH:mm para minutos desde o início do dia
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos para string HH:mm
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Obtém o nome do dia da semana em português
 */
export function getDayOfWeekName(dayOfWeek: string): string {
  const days: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  };
  return days[dayOfWeek] || dayOfWeek;
}

/**
 * Obtém o nome do status em português
 */
export function getStatusName(status: string): string {
  const statuses: Record<string, string> = {
    SCHEDULED: 'Agendado',
    CANCELLED: 'Cancelado',
    COMPLETED: 'Concluído',
    NO_SHOW: 'Não compareceu',
  };
  return statuses[status] || status;
}

/**
 * Gera um token seguro para confirmação de email
 */
export function generateConfirmationToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Valida se um email tem formato correto
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza uma string para evitar XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Calcula a duração em texto (e.g., "1 hora" ou "30 minutos")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutos`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let result = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (remainingMinutes > 0) {
    result += ` e ${remainingMinutes} minutos`;
  }
  return result;
}

/**
 * Obtém range de datas (útil para relatórios)
 */
export function getWeekDateRange(date: Date) {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return { start, end };
}

/**
 * Valida telefone brasileiro
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Formata telefone brasileiro
 */
export function formatBrazilianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Verifica diferença entre horários (útil para múltiplas consultas)
 */
export function canInstantlyBook(availableTime: number, durationMinutes: number): boolean {
  return availableTime >= durationMinutes;
}
