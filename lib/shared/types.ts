// ============================================
// CORE USER MANAGEMENT
// ============================================

export interface User {
  uid: string;
  email: string;
  phone?: string;
  password_hash?: string;
  role: 'patient' | 'doctor' | 'admin' | 'clinic';
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
  specialization: string[];
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
  country?: string;
  postal_code?: string;
  languages?: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  treated_patient_uids?: string[];
  custom_specializations?: string;
  clinic_id?: string;
  user?: User;
}

export interface Patient {
  pid: string;
  uid: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  blood_group?: string;
  allergies?: string[];
  current_medications?: string[];
  chronic_conditions?: string[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
  connected_doctor_uids?: string[];
  user?: User;
}

export interface Clinic {
  clinic_id: string;
  uid: string;
  clinic_name: string;
  registration_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// APPOINTMENTS & MEDICAL
// ============================================

export interface Appointment {
  aid: string;
  pid: string;
  did: string;
  mode: 'online' | 'offline' | 'in_person';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled' | 'in_progress' | 'pending';
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
  call_started_at?: string;
  call_ended_at?: string;
  call_duration_minutes?: number;
  payment_id?: string;
  payment_status?: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface Prescription {
  prescription_id: string;
  aid?: string;
  pid: string;
  did: string;
  diagnosis: string;
  symptoms?: string[];
  medicines: any; // JSONB
  instructions?: string;
  diet_advice?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  ai_generated: boolean;
  ai_suggestions?: any; // JSONB
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sent_to_patient: boolean;
  sent_at?: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface DoctorAvailability {
  availability_id: string;
  did: string;
  day_of_week: number; // 0-6
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  mode: 'online' | 'offline' | 'both';
  max_patients_per_slot: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface DoctorPatientRelationship {
  relationship_id: string;
  did: string;
  pid: string;
  is_primary: boolean;
  relationship_status: 'active' | 'inactive';
  first_appointment_date?: string;
  last_appointment_date?: string;
  total_appointments: number;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  patient?: Patient;
}

// ============================================
// MEDICATION TRACKING
// ============================================

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

export interface MedicationReminder {
  reminder_id: string;
  adherence_id: string;
  pid: string;
  reminder_time: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'dismissed';
  notification_type: 'push' | 'sms' | 'email';
  sent_at?: string;
  acknowledged_at?: string;
  created_at: string;
}

// ============================================
// E-COMMERCE & MARKETPLACE
// ============================================

export interface Medicine {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  stock_quantity: number;
  manufacturer?: string;
  dosage?: string;
  image_url?: string;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  medicine_id: string;
  quantity: number;
  created_at: string;
  medicine?: Medicine;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'PENDING_DELIVERY' | 'ACCEPTED_FOR_DELIVERY' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  total_amount: number;
  shipping_address?: any; // JSONB
  created_at: string;
  user?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  medicine_id?: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  medicine?: Medicine;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface OrderDeliveryAssignment {
  id: string;
  order_id: string;
  delivery_boy_id: string;
  assigned_at: string;
  delivery_agent?: DeliveryAgent;
}

export interface IgnoredOrder {
  id: string;
  order_id: string;
  delivery_boy_id: string;
  ignored_at: string;
}

// ============================================
// FINANCIAL
// ============================================

export interface FinanceTransaction {
  transaction_id: string;
  aid?: string;
  pid: string;
  did?: string;
  transaction_type: 'consultation' | 'refund' | 'cancellation_charge';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_method?: string;
  razorpay_response?: any; // JSONB
  description?: string;
  initiated_at: string;
  paid_at?: string;
  failed_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
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

// ============================================
// SYSTEM
// ============================================

export interface AppTranslation {
  translation_id: string;
  key: string;
  language_code: string;
  translated_text: string;
  created_at: string;
  updated_at: string;
}

export interface SyncQueue {
  sync_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: any; // JSONB
  status: 'pending' | 'synced' | 'failed';
  retry_count: number;
  error_message?: string;
  device_timestamp: string;
  synced_at?: string;
  created_at: string;
}

// ============================================
// VIEWS
// ============================================

export interface AdherenceProgress {
  pid: string;
  prescription_id: string;
  medicine_name: string;
  total_doses: number;
  taken_doses: number;
  skipped_doses: number;
  adherence_percentage: number;
}

// ============================================
// LEGACY/COMPATIBILITY (for existing code)
// ============================================

export interface Product extends Medicine { }
export interface DeliveryBoy extends DeliveryAgent { }
