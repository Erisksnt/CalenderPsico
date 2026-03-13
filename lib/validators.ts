import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Email inválido');
const publicEmailSchema = z.string().trim().toLowerCase().email('Insira um e-mail válido');
const publicPhoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10,11}$/, 'Insira um número de telefone válido');

export const TimeBlockSchema = z.object({
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const ServiceSchema = z.object({
  name: z.string().min(2),
  duration: z.number().min(15).max(180),
  price: z.number().min(0).optional(),
});

export const AdminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const AdminRegisterSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const ProfileSchema = z.object({
  full_name: z.string().min(3),
  photo_url: z.string().url().optional().or(z.literal('')),
  professional_bio: z.string().min(20),
  work_method: z.string().min(20),
  specialties: z.array(z.string().min(2)).min(1),
});

export const AvailabilityItemSchema = z.object({
  weekday: z.number().min(0).max(6),
  enabled: z.boolean(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  session_duration: z.number().min(30).max(120),
});

export const AvailabilitySchema = z.object({
  items: z.array(AvailabilityItemSchema).length(7),
});

export const BookAppointmentSchema = z.object({
  nome: z.string().min(3),
  email: publicEmailSchema,
  telefone: publicPhoneSchema,
  mensagem: z.string().max(1000).optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
});

/* legacy compatibility */
export const LoginSchema = AdminLoginSchema;
export const RegisterSchema = AdminRegisterSchema;
export const PsychologistProfileSchema = ProfileSchema;
export const CreateAppointmentSchema = BookAppointmentSchema;
export const UpdateAppointmentSchema = UpdateAppointmentStatusSchema;
