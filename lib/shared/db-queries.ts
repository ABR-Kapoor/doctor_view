// AuraSutra - Database Query Functions
import { supabase, executeQuery } from './supabase';
import type {
    User,
    Doctor,
    Patient,
    Appointment,
    Prescription,
    MedicationAdherence,
    AdherenceProgress,
    FinanceTransaction,
    AppointmentStatus,
} from './types';

// ==================== USER QUERIES ====================

export async function getUserByAuthId(authId: string) {
    return executeQuery<User>(async () => {
        return await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authId)
            .single();
    });
}

export async function getUserById(uid: string) {
    return executeQuery<User>(async () => {
        return await supabase
            .from('users')
            .select('*')
            .eq('uid', uid)
            .single();
    });
}

export async function createUser(user: Partial<User>) {
    return executeQuery<User>(async () => {
        return await supabase
            .from('users')
            .insert(user)
            .select()
            .single();
    });
}

export async function updateUser(uid: string, updates: Partial<User>) {
    return executeQuery<User>(async () => {
        return await supabase
            .from('users')
            .update(updates)
            .eq('uid', uid)
            .select()
            .single();
    });
}

// ==================== DOCTOR QUERIES ====================

export async function getDoctors(filters?: { specialization?: string; is_verified?: boolean }) {
    return executeQuery<Doctor[]>(async () => {
        let query = supabase
            .from('doctors')
            .select(`
        *,
        user:users(*)
      `)
            .eq('is_verified', true);

        if (filters?.specialization) {
            query = query.eq('specialization', filters.specialization);
        }

        return await query;
    });
}

export async function getDoctorById(did: string) {
    return executeQuery<Doctor>(async () => {
        return await supabase
            .from('doctors')
            .select(`
        *,
        user:users(*)
      `)
            .eq('did', did)
            .single();
    });
}

export async function getDoctorByUserId(uid: string) {
    return executeQuery<Doctor>(async () => {
        return await supabase
            .from('doctors')
            .select(`
        *,
        user:users(*)
      `)
            .eq('uid', uid)
            .single();
    });
}

export async function updateDoctor(did: string, updates: Partial<Doctor>) {
    return executeQuery<Doctor>(async () => {
        return await supabase
            .from('doctors')
            .update(updates)
            .eq('did', did)
            .select()
            .single();
    });
}

// ==================== PATIENT QUERIES ====================

export async function getPatientByUserId(uid: string) {
    return executeQuery<Patient>(async () => {
        return await supabase
            .from('patients')
            .select(`
        *,
        user:users(*)
      `)
            .eq('uid', uid)
            .single();
    });
}

export async function getPatientById(pid: string) {
    return executeQuery<Patient>(async () => {
        return await supabase
            .from('patients')
            .select(`
        *,
        user:users(*)
      `)
            .eq('pid', pid)
            .single();
    });
}

export async function updatePatient(pid: string, updates: Partial<Patient>) {
    return executeQuery<Patient>(async () => {
        return await supabase
            .from('patients')
            .update(updates)
            .eq('pid', pid)
            .select()
            .single();
    });
}

export async function createPatient(patient: Partial<Patient>) {
    return executeQuery<Patient>(async () => {
        return await supabase
            .from('patients')
            .insert(patient)
            .select()
            .single();
    });
}

// ==================== APPOINTMENT QUERIES ====================

export async function getAppointmentsByPatient(pid: string, status?: AppointmentStatus) {
    return executeQuery<Appointment[]>(async () => {
        let query = supabase
            .from('appointments')
            .select(`
        *,
        doctor:doctors!did(
          *,
          user:users(*)
        )
      `)
            .eq('pid', pid)
            .order('scheduled_date', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        return await query;
    });
}

export async function getAppointmentsByDoctor(did: string, status?: AppointmentStatus) {
    return executeQuery<Appointment[]>(async () => {
        let query = supabase
            .from('appointments')
            .select(`
        *,
        patient:patients!pid(
          *,
          user:users(*)
        )
      `)
            .eq('did', did)
            .order('scheduled_date', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        return await query;
    });
}

export async function getTodaysAppointments(did: string) {
    const today = new Date().toISOString().split('T')[0];

    return executeQuery<Appointment[]>(async () => {
        return await supabase
            .from('appointments')
            .select(`
        *,
        patient:patients!pid(
          *,
          user:users(*)
        )
      `)
            .eq('did', did)
            .eq('scheduled_date', today)
            .order('scheduled_time', { ascending: true });
    });
}

export async function getAppointmentById(aid: string) {
    return executeQuery<Appointment>(async () => {
        return await supabase
            .from('appointments')
            .select(`
        *,
        patient:patients!pid(
          *,
          user:users(*)
        ),
        doctor:doctors!did(
          *,
          user:users(*)
        )
      `)
            .eq('aid', aid)
            .single();
    });
}

export async function createAppointment(appointment: Partial<Appointment>) {
    return executeQuery<Appointment>(async () => {
        return await supabase
            .from('appointments')
            .insert(appointment)
            .select()
            .single();
    });
}

export async function updateAppointment(aid: string, updates: Partial<Appointment>) {
    return executeQuery<Appointment>(async () => {
        return await supabase
            .from('appointments')
            .update(updates)
            .eq('aid', aid)
            .select()
            .single();
    });
}

// ==================== PRESCRIPTION QUERIES ====================

export async function getPrescriptionsByPatient(pid: string) {
    return executeQuery<Prescription[]>(async () => {
        return await supabase
            .from('prescriptions')
            .select(`
        *,
        doctor:doctors!did(
          *,
          user:users(*)
        ),
        appointment:appointments!aid(*)
      `)
            .eq('pid', pid)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
    });
}

export async function getPrescriptionsByDoctor(did: string) {
    return executeQuery<Prescription[]>(async () => {
        return await supabase
            .from('prescriptions')
            .select(`
        *,
        patient:patients!pid(
          *,
          user:users(*)
        ),
        appointment:appointments!aid(*)
      `)
            .eq('did', did)
            .order('created_at', { ascending: false });
    });
}

export async function getPrescriptionById(prescriptionId: string) {
    return executeQuery<Prescription>(async () => {
        return await supabase
            .from('prescriptions')
            .select(`
        *,
        patient:patients!pid(
          *,
          user:users(*)
        ),
        doctor:doctors!did(
          *,
          user:users(*)
        ),
        appointment:appointments!aid(*)
      `)
            .eq('prescription_id', prescriptionId)
            .single();
    });
}

export async function createPrescription(prescription: Partial<Prescription>) {
    return executeQuery<Prescription>(async () => {
        return await supabase
            .from('prescriptions')
            .insert(prescription)
            .select()
            .single();
    });
}

// ==================== MEDICATION ADHERENCE QUERIES ====================

export async function getMedicationAdherence(pid: string, prescriptionId?: string) {
    return executeQuery<MedicationAdherence[]>(async () => {
        let query = supabase
            .from('medication_adherence')
            .select('*')
            .eq('pid', pid)
            .order('scheduled_date', { ascending: false });

        if (prescriptionId) {
            query = query.eq('prescription_id', prescriptionId);
        }

        return await query;
    });
}

export async function getAdherenceProgress(pid: string) {
    return executeQuery<AdherenceProgress[]>(async () => {
        return await supabase
            .from('adherence_progress')
            .select('*')
            .eq('pid', pid);
    });
}

export async function updateMedicationAdherence(
    adherenceId: string,
    updates: Partial<MedicationAdherence>
) {
    return executeQuery<MedicationAdherence>(async () => {
        return await supabase
            .from('medication_adherence')
            .update(updates)
            .eq('adherence_id', adherenceId)
            .select()
            .single();
    });
}

// ==================== FINANCE QUERIES ====================

export async function getTransactionsByPatient(pid: string) {
    return executeQuery<FinanceTransaction[]>(async () => {
        return await supabase
            .from('finance_transactions')
            .select('*')
            .eq('pid', pid)
            .order('created_at', { ascending: false });
    });
}

export async function createTransaction(transaction: Partial<FinanceTransaction>) {
    return executeQuery<FinanceTransaction>(async () => {
        return await supabase
            .from('finance_transactions')
            .insert(transaction)
            .select()
            .single();
    });
}

export async function updateTransaction(
    transactionId: string,
    updates: Partial<FinanceTransaction>
) {
    return executeQuery<FinanceTransaction>(async () => {
        return await supabase
            .from('finance_transactions')
            .update(updates)
            .eq('transaction_id', transactionId)
            .select()
            .single();
    });
}
