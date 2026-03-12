// lib/database.ts
// Configuração do Prisma e funções de banco de dados

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Cria uma única instância do Prisma (singleton pattern)
 * Evita múltiplas conexões durante desenvolvimento
 */
const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

/**
 * Teste a conexão com o banco de dados
 */
export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    return false;
  }
}

/**
 * Desconecta do banco de dados
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * Funções auxiliares de banco de dados
 */

/**
 * Verifica se um psicólogo existe
 */
export async function psychologistExists(userId: string) {
  const psychologist = await prisma.psychologist.findUnique({
    where: { user_id: userId },
  });
  return !!psychologist;
}

/**
 * Obtém um psicólogo pelo user_id
 */
export async function getPsychologistByUserId(userId: string) {
  return await prisma.psychologist.findUnique({
    where: { user_id: userId },
    include: {
      services: true,
      availabilities: true,
    },
  });
}

/**
 * Obtém um psicólogo pelo ID
 */
export async function getPsychologistById(id: string) {
  return await prisma.psychologist.findUnique({
    where: { id },
    include: {
      services: true,
      availabilities: true,
    },
  });
}

/**
 * Cria um novo paciente
 */
export async function createPatient(name: string, email: string, phone: string) {
  return await prisma.patient.create({
    data: {
      name,
      email,
      phone,
    },
  });
}

/**
 * Obtém ou cria um paciente
 */
export async function getOrCreatePatient(name: string, email: string, phone: string) {
  const existingPatient = await prisma.patient.findUnique({
    where: { email },
  });

  if (existingPatient) {
    return existingPatient;
  }

  return await createPatient(name, email, phone);
}

/**
 * Verifica conflito de horário
 */
export async function checkTimeSlotConflict(
  psychologistId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      psychologist_id: psychologistId,
      status: { not: 'CANCELLED' },
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      AND: [
        { start_time: { lt: endTime } },
        { end_time: { gt: startTime } },
      ],
    },
  });

  return !!conflict;
}

/**
 * Lista agendamentos para um psicólogo
 */
export async function getAppointmentsForPsychologist(
  psychologistId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }
) {
  const where: any = {
    psychologist_id: psychologistId,
  };

  if (filters?.startDate || filters?.endDate) {
    where.start_time = {};
    if (filters.startDate) {
      where.start_time.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.start_time.lte = filters.endDate;
    }
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  return await prisma.appointment.findMany({
    where,
    include: {
      service: true,
      patient: true,
    },
    orderBy: {
      start_time: 'asc',
    },
  });
}

/**
 * Lista agendamentos para um paciente
 */
export async function getAppointmentsForPatient(
  patientId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }
) {
  const where: any = {
    patient_id: patientId,
  };

  if (filters?.startDate || filters?.endDate) {
    where.start_time = {};
    if (filters.startDate) {
      where.start_time.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.start_time.lte = filters.endDate;
    }
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  return await prisma.appointment.findMany({
    where,
    include: {
      service: true,
      psychologist: true,
    },
    orderBy: {
      start_time: 'asc',
    },
  });
}

/**
 * Calcula estatísticas de um psicólogo
 */
export async function getPsychologistStats(psychologistId: string) {
  const [totalAppointments, completedAppointments, cancelledAppointments] = await Promise.all([
    prisma.appointment.count({
      where: { psychologist_id: psychologistId },
    }),
    prisma.appointment.count({
      where: {
        psychologist_id: psychologistId,
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.count({
      where: {
        psychologist_id: psychologistId,
        status: 'CANCELLED',
      },
    }),
  ]);

  return {
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments: totalAppointments - completedAppointments - cancelledAppointments,
  };
}

/**
 * Log de auditoria
 */
export async function createAuditLog(
  entityType: string,
  entityId: string,
  action: string,
  userId?: string,
  oldValues?: any,
  newValues?: any
) {
  return await prisma.auditLog.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,
      action,
      user_id: userId,
      old_values: oldValues ? JSON.stringify(oldValues) : undefined,
      new_values: newValues ? JSON.stringify(newValues) : undefined,
      ip_address: undefined, // Será preenchido na API route
    },
  });
}
