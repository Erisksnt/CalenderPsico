// Types para o sistema completo de agendamento

export type UserRole = 'psychologist' | 'patient';
export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed' | 'no-show';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// ==================== USER TYPES ====================
export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

// ==================== PSYCHOLOGIST TYPES ====================
export interface Psychologist {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  specialties: string[];
  registration_number: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== PATIENT TYPES ====================
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== SERVICE TYPES ====================
export interface Service {
  id: string;
  psychologist_id: string;
  name: string;
  description?: string;
  duration: number; // em minutos (30, 45, 60)
  price: number; // em centavos
  created_at: Date;
  updated_at: Date;
}

// ==================== AVAILABILITY TYPES ====================
export interface Availability {
  id: string;
  psychologist_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_blocked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AvailabilitySlot {
  id: string;
  start_time: Date;
  end_time: Date;
  available: boolean;
}

// ==================== APPOINTMENT TYPES ====================
export interface Appointment {
  id: string;
  service_id: string;
  patient_id: string;
  start_time: Date;
  end_time: Date;
  status: AppointmentStatus;
  notes?: string;
  confirmation_token?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAppointmentRequest {
  service_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  start_time: Date;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
  notes?: string;
  start_time?: Date;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== AUTH TYPES ====================
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone?: string;
  registration_number?: string; // for psychologists only
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// ==================== VALIDATION SCHEMAS ====================
export interface ValidationError {
  field: string;
  message: string;
}

// ==================== FILTER TYPES ====================
export interface AppointmentFilters {
  status?: AppointmentStatus;
  psychologist_id?: string;
  patient_id?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  pageSize?: number;
}

export interface AvailabilityFilters {
  psychologist_id: string;
  date?: Date;
  day_of_week?: DayOfWeek;
  exclude_blocked?: boolean;
}
