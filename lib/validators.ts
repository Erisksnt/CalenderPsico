import { z } from 'zod';
import type { SiteSettings } from './site-settings-types';

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
  password: z.string().min(8, 'Credenciais inválidas'),
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

const photoUrlSchema = z.union([
  z.string().url(),
  z.string().regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, 'URL da foto inválida'),
  z.literal(''),
]);

export const ProfileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  photo_url: photoUrlSchema.optional(),
  professional_bio: z.string().min(3, 'Bio deve ter no mínimo 3 caracteres'),
  work_method: z.string().min(3, 'Método de trabalho deve ter no mínimo 3 caracteres'),
  specialties: z.array(z.string().min(2)).default([]),
});

const DAY_OF_WEEK_VALUES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export const AvailabilityItemSchema = z.object({
  day_of_week: z.enum(DAY_OF_WEEK_VALUES),
  is_blocked: z.boolean().default(false),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  session_duration: z.number().min(30).max(120),
});

export const AvailabilityBulkSchema = z.object({
  items: z
    .array(AvailabilityItemSchema)
    .length(DAY_OF_WEEK_VALUES.length)
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.day_of_week)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['items', index, 'day_of_week'],
            message: 'Dia da semana duplicado',
          });
        }
        seen.add(item.day_of_week);
      });
      if (seen.size !== DAY_OF_WEEK_VALUES.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items'],
          message: 'Cada dia da semana deve aparecer apenas uma vez',
        });
      }
    }),
});

export const AvailabilityCreateSchema = AvailabilityItemSchema.omit({
  is_blocked: true,
  session_duration: true,
});

export const BookAppointmentSchema = z.object({
  nome: z.string().min(3),
  email: publicEmailSchema,
  telefone: publicPhoneSchema,
  mensagem: z.string().max(1000).optional(),
  data: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, 'Data inválida'),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  consent: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar a política de privacidade.' }) }),
});

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const siteImageUrl = z
  .string()
  .max(2048)
  .refine(
    (value) => value === '' || (value.startsWith('/') && !value.startsWith('//')) || isHttpUrl(value),
    'URL de imagem inválida',
  );

const siteLink = z
  .string()
  .max(2048)
  .refine((value) => value === '' || isHttpUrl(value), 'Endereço inválido');

const sectionIds = [
  'hero',
  'about',
  'appointments',
  'method',
  'identification',
  'closing_cta',
] as const;

export const SiteSettingsSchema: z.ZodType<SiteSettings> = z.object({
  brand: z.object({
    name: z.string().max(160),
    professional_title: z.string().max(160),
    logo_url: siteImageUrl,
    footer_description: z.string().max(3000),
    emergency_notice: z.string().max(3000),
  }),
  navigation: z.array(
    z.object({
      id: z.string().min(1).max(64),
      label: z.string().max(120),
      href: z.string().max(2048).refine(
        (value) =>
          (value.startsWith('/') && !value.startsWith('//')) ||
          /^#[\w-]+$/.test(value) ||
          isHttpUrl(value),
        'Link inválido',
      ),
    }),
  ).max(20),
  contacts: z.object({
    whatsapp_number: z.string().max(20).regex(/^[+\d\s()-]*$/),
    whatsapp_message: z.string().max(500),
    whatsapp_link: siteLink,
    instagram_url: siteLink,
    tiktok_url: siteLink,
    email: z.union([z.literal(''), z.string().email().max(254)]),
    phone: z.string().max(40),
    crp: z.string().max(80),
    address: z.string().max(500),
  }),
  hero: z.object({
    badge: z.string().max(160),
    title: z.string().max(500),
    title_highlight: z.string().max(500),
    subtitle: z.string().max(3000),
    cta_text: z.string().max(120),
    secondary_cta_text: z.string().max(120),
    photo_url: siteImageUrl,
    photo_alt: z.string().max(300),
    photo_frame: z.enum(['arch', 'rounded', 'oval', 'bordered']),
    specialties: z.array(z.string().max(180)).max(30),
    highlights: z.array(z.string().max(180)).max(10),
  }),
  about: z.object({
    badge: z.string().max(160),
    title: z.string().max(500),
    paragraph_1: z.string().max(5000),
    paragraph_2: z.string().max(5000),
    work_method: z.string().max(5000),
    photo_url: siteImageUrl,
    photo_alt: z.string().max(300),
    photo_frame: z.enum(['arch', 'rounded', 'oval', 'bordered']),
    features_heading: z.string().max(180),
    features: z.array(z.string().max(500)).max(30),
    cta_text: z.string().max(120),
  }),
  appointments: z.object({
    badge: z.string().max(160),
    title: z.string().max(500),
    modality_label: z.string().max(120),
    modality: z.string().max(300),
    duration_label: z.string().max(120),
    duration: z.string().max(120),
    paragraphs: z.array(z.string().max(3000)).max(20),
    complementary_paragraphs: z.array(z.string().max(3000)).max(20),
  }),
  method: z.object({
    badge: z.string().max(160),
    title: z.string().max(500),
    subtitle: z.string().max(3000),
    steps: z.array(z.object({
      number: z.string().max(20),
      title: z.string().max(300),
      description: z.string().max(2000),
    })).max(30),
  }),
  identification: z.object({
    badge: z.string().max(160),
    title: z.string().max(500),
    subtitle: z.string().max(3000),
    items: z.array(z.object({
      icon: z.string().max(32),
      title: z.string().max(300),
      description: z.string().max(2000),
    })).max(30),
    bottom_text: z.string().max(2000),
    cta_text: z.string().max(120),
  }),
  closing_cta: z.object({
    title: z.string().max(500),
    subtitle: z.string().max(3000),
    button_text: z.string().max(120),
  }),
  footer: z.object({
    navigation_heading: z.string().max(120),
    contact_heading: z.string().max(120),
    registration_label: z.string().max(120),
    privacy_label: z.string().max(120),
    copyright_text: z.string().max(300),
  }),
  appearance: z.object({
    colors: z.object({
      background: z.string().regex(/^#[\da-fA-F]{6}$/),
      surface: z.string().regex(/^#[\da-fA-F]{6}$/),
      accent: z.string().regex(/^#[\da-fA-F]{6}$/),
      accent_dark: z.string().regex(/^#[\da-fA-F]{6}$/),
      text: z.string().regex(/^#[\da-fA-F]{6}$/),
      text_muted: z.string().regex(/^#[\da-fA-F]{6}$/),
    }),
    alignment: z.object({
      hero: z.enum(['left', 'center']),
      about: z.enum(['left', 'center']),
      appointments: z.enum(['left', 'center']),
      method: z.enum(['left', 'center']),
      identification: z.enum(['left', 'center']),
      closing_cta: z.enum(['left', 'center']),
    }),
    section_spacing: z.enum(['compact', 'comfortable', 'spacious']),
    decorative_dividers: z.boolean(),
    heading_font: z.enum(['The Seasons', 'Cormorant Garamond', 'Playfair Display', 'Georgia']),
    body_font: z.enum(['Garet', 'Inter', 'Montserrat', 'Open Sans', 'Arial']),
    heading_font_size: z.number().int().min(24).max(72),
    body_font_size: z.number().int().min(12).max(24),
  }),
  sections: z.object({
    order: z.array(z.enum(sectionIds)).length(sectionIds.length)
      .refine((items) => new Set(items).size === sectionIds.length, 'Ordem de seções inválida'),
    visibility: z.object({
      hero: z.boolean(),
      about: z.boolean(),
      appointments: z.boolean(),
      method: z.boolean(),
      identification: z.boolean(),
      closing_cta: z.boolean(),
    }),
  }),
});

/* legacy compatibility */
export const LoginSchema = AdminLoginSchema;
export const RegisterSchema = AdminRegisterSchema;
export const PsychologistProfileSchema = ProfileSchema;
export const CreateAppointmentSchema = BookAppointmentSchema;
export const UpdateAppointmentSchema = UpdateAppointmentStatusSchema;
export const AvailabilitySchema = AvailabilityCreateSchema;
