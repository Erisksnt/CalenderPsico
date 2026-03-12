// lib/validators.ts
// Schemas de validação de dados usando Zod

import { z } from 'zod';
import { UserRole, AppointmentStatus } from '@/types';

// Validador customizado para telefone (aceita formatação)
const phoneValidator = z.string()
  .transform(val => val.replace(/\D/g, '')) // Remove tudo que não é digit
  .refine(
    val => val.length === 10 || val.length === 11,
    'Telefone deve ter 10 ou 11 dígitos'
  );

// ==================== AUTH VALIDATORS ====================

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter at least 6 caracteres'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter at least 6 caracteres'),
  role: z.enum(['PSYCHOLOGIST', 'PATIENT'] as const),
  name: z.string().min(2, 'Nome deve ter at least 2 caracteres'),
  phone: phoneValidator.optional(),
  registration_number: z.string().optional(), // For psychologists
});

// ==================== PSYCHOLOGIST VALIDATORS ====================

export const PsychologistProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter at least 2 caracteres'),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  registration_number: z.string()
    .regex(/^\d{5}\/[A-Z]{2}$/, 'Formato inválido para CRP'),
  phone: phoneValidator.optional(),
});

export const UpdatePsychologistSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  phone: phoneValidator.optional(),
});

// ==================== SERVICE VALIDATORS ====================

export const ServiceSchema = z.object({
  name: z.string().min(3, 'Nome do serviço deve ter at least 3 caracteres'),
  description: z.string().optional(),
  duration: z.number()
    .int()
    .refine(val => [30, 45, 60, 90, 120].includes(val), 
      'Duração deve ser 30, 45, 60, 90 ou 120 minutos'),
  price: z.number().positive('Preço deve ser positivo'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser hexadecimal'),
});

// ==================== AVAILABILITY VALIDATORS ====================

export const TimeSchema = z.string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato deve ser HH:mm');

export const AvailabilitySchema = z.object({
  day_of_week: z.enum([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 
    'FRIDAY', 'SATURDAY', 'SUNDAY'
  ] as const),
  start_time: TimeSchema,
  end_time: TimeSchema,
}).refine(
  (data) => {
    const [startH, startM] = data.start_time.split(':').map(Number);
    const [endH, endM] = data.end_time.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    return endMins > startMins;
  },
  {
    message: "Hora de término deve ser após a hora de início",
    path: ["end_time"],
  }
);

// ==================== APPOINTMENT VALIDATORS ====================

export const CreateAppointmentSchema = z.object({
  service_id: z.string().uuid('ID de serviço inválido'),
  patient_name: z.string().min(2, 'Nome deve ter at least 2 caracteres'),
  patient_email: z.string().email('Email inválido'),
  patient_phone: phoneValidator,
  start_time: z.string().datetime('Data/hora inválida'),
  notes: z.string().optional(),
});

export const UpdateAppointmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const).optional(),
  notes: z.string().optional(),
  start_time: z.string().datetime().optional(),
});

// ==================== TIME BLOCK VALIDATORS ====================

export const TimeBlockSchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  reason: z.string().min(3, 'Motivo deve ter at least 3 caracteres'),
}).refine(
  (data) => new Date(data.end_time) > new Date(data.start_time),
  {
    message: "Data/hora de término deve ser após a de início",
    path: ["end_time"],
  }
);

// ==================== PATIENT VALIDATORS ====================

export const PatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter at least 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: phoneValidator,
  notes: z.string().optional(),
});

// Type exports para usar em componentes
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PsychologistProfileInput = z.infer<typeof PsychologistProfileSchema>;
export type ServiceInput = z.infer<typeof ServiceSchema>;
export type AvailabilityInput = z.infer<typeof AvailabilitySchema>;
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type TimeBlockInput = z.infer<typeof TimeBlockSchema>;
export type PatientInput = z.infer<typeof PatientSchema>;
