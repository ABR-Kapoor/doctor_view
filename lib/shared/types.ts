// AuraSutra - Shared Type Definitions
// Database entity types matching the SQL schema

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  uid: string;
  email: string;
  phone?: string;
  password_hash?: string;
  role: UserRole;
  name: string;
  profile_image_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  auth_id?: string;
}

export interface Doctor {
  did: string;
  uid: string;
  specialization: string;
  qualification: string;
  registration_number?: string;
  years_of_experience: number;
  consultation_fee: number;
  bio?: string;
  clinic_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  languages?: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  treated_patient_uids: string[];
  // Joined user data
  user?: User;
}

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Patient {
  pid: string;
  uid: string;
  date_of_birth?: string;
  gender?: Gender;
  blood_group?: string;
  allergies?: string[];
  current_medications?: string[];
  chronic_conditions?: string[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
  connected_doctor_uids: string[];
  // Joined user data
  user?: User;
}

export type AppointmentMode = 'online' | 'offline';
export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'rescheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface Appointment {
  aid: string;
  pid: string;
  did: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  scheduled_date: string;
  scheduled_time: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  token_number?: number;
  queue_position?: number;
  estimated_wait_minutes?: number;
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  chief_complaint: string;
  symptoms?: string[];
  doctor_notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: Patient;
  doctor?: Doctor;
  patient_user?: User;
  doctor_user?: User;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  prescription_id: string;
  aid: string;
  pid: string;
  did: string;
  diagnosis: string;
  symptoms?: string[];
  medicines: Medicine[];
  instructions?: string;
  diet_advice?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  ai_generated: boolean;
  ai_suggestions?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  appointment?: Appointment;
  patient?: Patient;
  doctor?: Doctor;
}

export interface MedicationAdherence {
  adherence_id: string;
  prescription_id: string;
  pid: string;
  medicine_name: string;
  scheduled_date: string;
  scheduled_time: string;
  taken_at?: string;
  is_taken: boolean;
  is_skipped: boolean;
  skip_reason?: string;
  synced: boolean;
  device_timestamp?: string;
  created_at: string;
  updated_at: string;
}

export interface AdherenceProgress {
  pid: string;
  prescription_id: string;
  medicine_name: string;
  total_doses: number;
  taken_doses: number;
  skipped_doses: number;
  adherence_percentage: number;
}

export type TransactionType = 'consultation' | 'refund' | 'cancellation_charge';
export type TransactionStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface FinanceTransaction {
  transaction_id: string;
  aid?: string;
  pid: string;
  did?: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_method?: string;
  razorpay_response?: any;
  description?: string;
  initiated_at: string;
  paid_at?: string;
  failed_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  receipt_id: string;
  transaction_id: string;
  receipt_number: string;
  receipt_date: string;
  pid: string;
  did: string;
  patient_name: string;
  doctor_name: string;
  consultation_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method?: string;
  razorpay_payment_id?: string;
  generated_at: string;
}

// Chart data types
export interface MedicationChartData {
  date: string;
  taken: number;
  skipped: number;
  total: number;
}

export interface AdherenceDonutData {
  name: string;
  value: number;
  percentage: number;
}

export interface AppointmentTimelineData {
  aid: string;
  date: string;
  time: string;
  doctor_name: string;
  status: AppointmentStatus;
  mode: AppointmentMode;
}

export interface AnalyticsData {
  total_patients: number;
  total_appointments: number;
  total_revenue: number;
  avg_adherence: number;
  appointments_per_month: { month: string; count: number }[];
  patients_treated_over_time: { date: string; count: number }[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface AppointmentBookingForm {
  did: string;
  mode: AppointmentMode;
  scheduled_date: string;
  scheduled_time: string;
  chief_complaint: string;
  symptoms: string[];
}

export interface PrescriptionForm {
  aid: string;
  pid: string;
  diagnosis: string;
  symptoms: string[];
  medicines: Medicine[];
  instructions?: string;
  diet_advice?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
}
