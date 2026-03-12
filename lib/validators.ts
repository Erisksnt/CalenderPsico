import { z } from 'zod';

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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
  email: z.string().email(),
  telefone: z.string().min(8),
  mensagem: z.string().max(1000).optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
});

// legacy exports used by old files
export const LoginSchema = AdminLoginSchema;
export const RegisterSchema = AdminLoginSchema;
export const PsychologistProfileSchema = ProfileSchema;
export const ServiceSchema = z.any();
export const CreateAppointmentSchema = BookAppointmentSchema;
export const UpdateAppointmentSchema = UpdateAppointmentStatusSchema;
export const TimeBlockSchema = z.any();
export const PatientSchema = z.any();
