-- ==============================================================================
-- AURASUTRA - COMPLETE NEON DATABASE MIGRATION
-- ==============================================================================
-- Platform  : AuraSutra Ayurvedic Healthcare Platform
-- Database  : PostgreSQL (Neon Serverless)
-- Version   : 1.0.0
-- Updated   : 2026-03-07
--
-- This file contains the COMPLETE database schema for the AuraSutra platform.
-- It includes all tables, functions, triggers, views, materialized views,
-- indexes, sequences, and storage bucket setup.
--
-- USAGE:
--   Run this file against a fresh Neon PostgreSQL database.
--   All objects use IF NOT EXISTS / CREATE OR REPLACE for idempotency.
--
-- ORDER OF EXECUTION:
--   1. Extensions
--   2. Sequences
--   3. Functions (must exist before triggers reference them)
--   4. Tables (ordered by foreign key dependencies)
--   5. Indexes
--   6. Triggers
--   7. Views & Materialized Views
--   8. Storage Bucket Setup (Nhost)
-- ==============================================================================


-- ==============================================================================
-- SECTION 1: EXTENSIONS
-- ==============================================================================

-- pgcrypto provides gen_random_uuid() on older PG versions (Neon has it natively)
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ==============================================================================
-- SECTION 2: SEQUENCES
-- ==============================================================================

CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;


-- ==============================================================================
-- SECTION 3: FUNCTIONS
-- ==============================================================================

-- 3.1  UPDATE_UPDATED_AT_COLUMN
-- Used by multiple triggers to auto-update the updated_at timestamp
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


-- 3.2  SYNC_USER_ROLE_TABLES
-- When a user's role changes, ensure the matching role table has a record
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_role_tables()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role = 'patient' THEN
        INSERT INTO patients (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;

        DELETE FROM doctors WHERE uid = NEW.uid;
    END IF;

    IF NEW.role = 'doctor' THEN
        INSERT INTO doctors (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;

        DELETE FROM patients WHERE uid = NEW.uid;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.3  AUTO_INSERT_USER_ROLE
-- On user creation, auto-create the matching patient/doctor record
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_insert_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role = 'patient' THEN
        INSERT INTO patients (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;
    ELSIF NEW.role = 'doctor' THEN
        INSERT INTO doctors (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.4  AUTO_MANAGE_USER_ROLES
-- Comprehensive role management: creates patient/doctor/delivery_agent records
-- on insert or role update, and cleans up old role records
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_manage_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Handle patient role
    IF NEW.role = 'patient' THEN
        INSERT INTO patients (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;
    END IF;

    -- Handle doctor role
    IF NEW.role = 'doctor' THEN
        INSERT INTO doctors (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;
    END IF;

    -- Handle clinic role
    IF NEW.role = 'clinic' THEN
        INSERT INTO clinics (uid, clinic_name)
        VALUES (NEW.uid, COALESCE(NEW.name, 'Unnamed Clinic'))
        ON CONFLICT (uid) DO NOTHING;
    END IF;

    -- Handle delivery_boy role
    IF NEW.role = 'delivery_boy' THEN
        INSERT INTO delivery_agents (name, email, uid, auth_id)
        VALUES (NEW.name, NEW.email, NEW.uid, NEW.auth_id)
        ON CONFLICT (uid) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.5  VALIDATE_USER_ROLE_CHANGE
-- Prevents invalid role transitions (e.g., delivery_boy cannot change roles)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Prevent role change if the user is a delivery_boy
    IF OLD.role = 'delivery_boy' AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Delivery boy accounts cannot change their role';
    END IF;

    -- Ensure the new role is a valid role
    IF NEW.role NOT IN ('patient', 'doctor', 'admin', 'clinic', 'delivery_boy') THEN
        RAISE EXCEPTION 'Invalid role: %', NEW.role;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.6  PREVENT_DELIVERY_BOY_ROLE_CHANGE
-- Hard block on delivery_boy role changes (fires as BEFORE trigger)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_delivery_boy_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.role = 'delivery_boy' AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Cannot change role of a delivery boy account. Delete and recreate instead.';
    END IF;
    RETURN NEW;
END;
$$;


-- 3.7  AUTO_CREATE_DELIVERY_AGENT
-- When a user is created/updated with role delivery_boy, auto-create delivery_agents record
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_create_delivery_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role = 'delivery_boy' THEN
        INSERT INTO delivery_agents (name, email, uid, phone, auth_id)
        VALUES (NEW.name, NEW.email, NEW.uid, NEW.phone, NEW.auth_id)
        ON CONFLICT (uid) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            auth_id = EXCLUDED.auth_id;
    END IF;
    RETURN NEW;
END;
$$;


-- 3.8  SYNC_USER_UPDATES
-- Propagates user data changes (name, email, phone) to related tables
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Sync to delivery_agents if applicable
    IF EXISTS (SELECT 1 FROM delivery_agents WHERE uid = NEW.uid) THEN
        UPDATE delivery_agents
        SET
            name = NEW.name,
            email = NEW.email,
            phone = NEW.phone
        WHERE uid = NEW.uid;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.9  SYNC_USER_NAME_CHANGES
-- Specifically syncs name changes to delivery_agents
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_name_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Sync name to delivery_agents
    UPDATE delivery_agents
    SET name = NEW.name
    WHERE uid = NEW.uid;

    RETURN NEW;
END;
$$;


-- 3.10 ENFORCE_PATIENT_ROLE
-- Ensures that only users with role 'patient' can have patient records
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_patient_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM users WHERE uid = NEW.uid;

    IF user_role IS NULL THEN
        -- User might not exist yet (deferred constraint), allow it
        RETURN NEW;
    END IF;

    IF user_role != 'patient' THEN
        RAISE EXCEPTION 'User % does not have the patient role (current role: %)', NEW.uid, user_role;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.11 ENFORCE_DOCTOR_ROLE
-- Ensures that only users with role 'doctor' can have doctor records
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_doctor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM users WHERE uid = NEW.uid;

    IF user_role IS NULL THEN
        RETURN NEW;
    END IF;

    IF user_role != 'doctor' THEN
        RAISE EXCEPTION 'User % does not have the doctor role (current role: %)', NEW.uid, user_role;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.12 ENFORCE_DELIVERY_AGENT_ROLE
-- Ensures that only users with role 'delivery_boy' can have delivery_agent records
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_delivery_agent_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    IF NEW.uid IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT role INTO user_role FROM users WHERE uid = NEW.uid;

    IF user_role IS NULL THEN
        RETURN NEW;
    END IF;

    IF user_role != 'delivery_boy' THEN
        RAISE EXCEPTION 'User % does not have the delivery_boy role (current role: %)', NEW.uid, user_role;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.13 GENERATE_RECEIPT_NUMBER
-- Auto-generates receipt numbers in format RCP-YYYYMMDD-000001
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'RCP-' ||
                             TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                             LPAD(nextval('receipt_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;


-- 3.14 GENERATE_TOKEN_NUMBER
-- Auto-generates appointment token numbers for offline/in_person appointments
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_token_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_token INTEGER;
BEGIN
    IF NEW.mode IN ('offline', 'in_person') AND NEW.token_number IS NULL THEN
        SELECT COALESCE(MAX(token_number), 0) + 1
        INTO next_token
        FROM appointments
        WHERE did = NEW.did
          AND scheduled_date = NEW.scheduled_date
          AND mode IN ('offline', 'in_person');

        NEW.token_number := next_token;
        NEW.queue_position := next_token;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.15 GENERATE_ORDER_NUMBER
-- Auto-generates order numbers in format ORD-YYYYMMDD-000001
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' ||
                           TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                           LPAD(nextval('order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;


-- 3.16 UPDATE_DOCTOR_PATIENT_RELATIONSHIP
-- Maintains the doctor_patient_relationships table on appointment changes
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_doctor_patient_relationship()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO doctor_patient_relationships (did, pid, first_appointment_date, last_appointment_date, total_appointments)
    VALUES (
        NEW.did,
        NEW.pid,
        NEW.scheduled_date,
        NEW.scheduled_date,
        1
    )
    ON CONFLICT (did, pid) DO UPDATE
    SET
        last_appointment_date = GREATEST(doctor_patient_relationships.last_appointment_date, NEW.scheduled_date),
        total_appointments = doctor_patient_relationships.total_appointments + 1,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;


-- 3.17 AUTO_CREATE_ADHERENCE_RECORDS
-- Creates medication adherence tracking records when a prescription is sent to patient
-- Parses medicine JSON to generate daily dose schedules
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_create_adherence_records()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  medicine_record JSONB;
  medicine_name TEXT;
  dosage_times TEXT[];
  time_slot TEXT;
  curr_date DATE;
  end_date DATE;
  duration_days INTEGER;
  duration_text TEXT;
BEGIN
  IF NEW.sent_to_patient = TRUE AND (OLD IS NULL OR OLD.sent_to_patient IS DISTINCT FROM TRUE) THEN

      FOR medicine_record IN SELECT * FROM jsonb_array_elements(NEW.medicines)
      LOOP
        medicine_name := medicine_record->>'name';

        -- Extract times array from medicine (e.g., ["09:00", "14:00", "21:00"])
        dosage_times := ARRAY(
          SELECT jsonb_array_elements_text(medicine_record->'times')
        );

        -- Parse duration
        duration_text := LOWER(TRIM(medicine_record->>'duration'));

        duration_days := CASE
          WHEN duration_text ~ '^\d+\s*day' THEN (regexp_match(duration_text, '(\d+)'))[1]::INTEGER
          WHEN duration_text ~ '^\d+\s*week' THEN (regexp_match(duration_text, '(\d+)'))[1]::INTEGER * 7
          WHEN duration_text ~ '^\d+\s*month' THEN (regexp_match(duration_text, '(\d+)'))[1]::INTEGER * 30
          WHEN duration_text ~ '^\d+\s*year' THEN (regexp_match(duration_text, '(\d+)'))[1]::INTEGER * 365
          ELSE 7
        END;

        -- Parse Frequency to Times (if times array is empty)
        IF dosage_times IS NULL OR array_length(dosage_times, 1) IS NULL THEN
          DECLARE
             freq_text TEXT := LOWER(TRIM(medicine_record->>'frequency'));
          BEGIN
             IF freq_text ~ 'twice' OR freq_text ~ '2 times' OR freq_text ~ 'morning.*night' OR freq_text ~ 'morning.*evening' THEN
                 dosage_times := ARRAY['09:00', '21:00'];
             ELSIF freq_text ~ 'thrice' OR freq_text ~ '3 times' OR freq_text ~ 'morning.*afternoon.*night' THEN
                 dosage_times := ARRAY['09:00', '14:00', '21:00'];
             ELSIF freq_text ~ '4 times' OR freq_text ~ 'four times' THEN
                 dosage_times := ARRAY['08:00', '12:00', '16:00', '20:00'];
             ELSIF freq_text ~ 'bedtime' OR freq_text ~ 'night' THEN
                 dosage_times := ARRAY['22:00'];
             ELSIF freq_text ~ 'afternoon' OR freq_text ~ 'lunch' THEN
                 dosage_times := ARRAY['14:00'];
             ELSIF freq_text ~ 'morning' OR freq_text ~ 'breakfast' THEN
                 dosage_times := ARRAY['08:00'];
             ELSE
                 dosage_times := ARRAY['09:00'];
             END IF;
          END;
        END IF;

        curr_date := CURRENT_DATE;
        end_date := curr_date + duration_days;

        IF dosage_times IS NOT NULL AND array_length(dosage_times, 1) > 0 THEN
          WHILE curr_date < end_date LOOP
            FOREACH time_slot IN ARRAY dosage_times LOOP
              INSERT INTO medication_adherence (
                prescription_id, pid, medicine_name,
                scheduled_date, scheduled_time,
                is_taken, is_skipped, synced
              )
              VALUES (
                NEW.prescription_id, NEW.pid, medicine_name,
                curr_date, time_slot::TIME,
                false, false, false
              )
              ON CONFLICT (prescription_id, medicine_name, scheduled_date, scheduled_time)
              DO NOTHING;
            END LOOP;

            curr_date := curr_date + 1;
          END LOOP;
        END IF;
      END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


-- 3.18 REFRESH_ADHERENCE_SUMMARY
-- Refreshes the adherence_progress_summary materialized view
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_adherence_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY adherence_progress_summary;
    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        REFRESH MATERIALIZED VIEW adherence_progress_summary;
        RETURN NULL;
END;
$$;


-- 3.19 TRACK_ORDER_STATUS_CHANGE
-- Logs order status transitions to order_status_history
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (
            order_id, from_status, to_status, changed_by, changed_by_role
        )
        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.assigned_to_delivery_boy_id,
            CASE
                WHEN NEW.status IN ('ASSIGNED', 'PENDING_DELIVERY') THEN 'admin'
                WHEN NEW.status IN ('ACCEPTED_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED_BY_DELIVERY') THEN 'delivery_boy'
                WHEN NEW.status = 'CANCELLED' THEN 'admin'
                ELSE 'system'
            END
        );
    END IF;

    RETURN NEW;
END;
$$;


-- 3.20 UPDATE_DELIVERY_STATS
-- Updates delivery agent statistics when an order is marked as DELIVERED
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_delivery_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'DELIVERED' AND NEW.assigned_to_delivery_boy_id IS NOT NULL THEN
        UPDATE delivery_agents
        SET
            total_deliveries_completed = total_deliveries_completed + 1
        WHERE id = NEW.assigned_to_delivery_boy_id;
    END IF;

    RETURN NEW;
END;
$$;


-- 3.21 SYNC_CLINIC_NAME_TO_DOCTORS
-- When clinic name changes, sync it to all doctors in that clinic
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_clinic_name_to_doctors()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE doctors
    SET clinic_name = NEW.clinic_name
    WHERE clinic_id = NEW.clinic_id;
    RETURN NEW;
END;
$$;


-- ==============================================================================
-- SECTION 4: TABLES (ordered by foreign key dependencies)
-- ==============================================================================

-- 4.1  USERS - Central user table for all roles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    uid UUID NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT,
    role VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ,
    auth_id TEXT,

    CONSTRAINT users_pkey PRIMARY KEY (uid),
    CONSTRAINT users_auth_id_key UNIQUE (auth_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_phone_key UNIQUE (phone),
    CONSTRAINT users_role_check CHECK (
        role IN ('patient', 'doctor', 'admin', 'clinic', 'delivery_boy')
    )
);


-- 4.2  PATIENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
    pid UUID NOT NULL DEFAULT gen_random_uuid(),
    uid UUID NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(5),
    allergies TEXT[],
    current_medications TEXT[],
    chronic_conditions TEXT[],
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    connected_doctor_uids UUID[] DEFAULT '{}',

    CONSTRAINT patients_pkey PRIMARY KEY (pid),
    CONSTRAINT patients_uid_key UNIQUE (uid),
    CONSTRAINT fk_patients_user FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT patients_gender_check CHECK (
        gender IN ('male', 'female', 'other', 'prefer_not_to_say')
    )
);


-- 4.3  CLINICS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
    clinic_id UUID NOT NULL DEFAULT gen_random_uuid(),
    uid UUID NOT NULL,
    clinic_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT clinics_pkey PRIMARY KEY (clinic_id),
    CONSTRAINT clinics_registration_number_key UNIQUE (registration_number),
    CONSTRAINT clinics_uid_key UNIQUE (uid),
    CONSTRAINT clinics_uid_fkey FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE
);


-- 4.4  DOCTORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
    did UUID NOT NULL DEFAULT gen_random_uuid(),
    uid UUID NOT NULL,
    specialization TEXT[] NOT NULL DEFAULT ARRAY['General Medicine'],
    qualification TEXT NOT NULL DEFAULT 'MBBS',
    registration_number VARCHAR(100),
    years_of_experience INTEGER DEFAULT 0,
    consultation_fee NUMERIC(10, 2) DEFAULT 0,
    bio TEXT,
    clinic_name VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    languages TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    treated_patient_uids UUID[] DEFAULT '{}',
    custom_specializations TEXT,
    clinic_id UUID,

    CONSTRAINT doctors_pkey PRIMARY KEY (did),
    CONSTRAINT doctors_registration_number_key UNIQUE (registration_number),
    CONSTRAINT doctors_uid_key UNIQUE (uid),
    CONSTRAINT doctors_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics (clinic_id) ON DELETE SET NULL,
    CONSTRAINT doctors_uid_fkey FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);


-- 4.5  DELIVERY_AGENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_agents (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    uid UUID,
    phone VARCHAR(20),
    total_deliveries_completed INTEGER DEFAULT 0,
    average_rating NUMERIC(3, 2),
    is_available BOOLEAN DEFAULT TRUE,
    auth_id TEXT,
    age INTEGER,
    address TEXT,
    vehicle_number VARCHAR(20),
    profile_image_url TEXT,

    CONSTRAINT delivery_agents_pkey PRIMARY KEY (id),
    CONSTRAINT delivery_agents_auth_id_key UNIQUE (auth_id),
    CONSTRAINT delivery_agents_email_key UNIQUE (email),
    CONSTRAINT delivery_agents_uid_key UNIQUE (uid),
    CONSTRAINT delivery_agents_uid_fkey FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE
);


-- 4.6  DOCTOR_AVAILABILITY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_availability (
    availability_id UUID NOT NULL DEFAULT gen_random_uuid(),
    did UUID NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER DEFAULT 30,
    mode VARCHAR(20) NOT NULL,
    max_patients_per_slot INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT doctor_availability_pkey PRIMARY KEY (availability_id),
    CONSTRAINT doctor_availability_did_fkey FOREIGN KEY (did) REFERENCES doctors (did) ON DELETE CASCADE,
    CONSTRAINT doctor_availability_check CHECK (end_time > start_time),
    CONSTRAINT doctor_availability_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT doctor_availability_mode_check CHECK (mode IN ('online', 'offline', 'both'))
);


-- 4.7  DOCTOR_PATIENT_RELATIONSHIPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_patient_relationships (
    relationship_id UUID NOT NULL DEFAULT gen_random_uuid(),
    did UUID NOT NULL,
    pid UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    relationship_status VARCHAR(20) DEFAULT 'active',
    first_appointment_date DATE,
    last_appointment_date DATE,
    total_appointments INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT doctor_patient_relationships_pkey PRIMARY KEY (relationship_id),
    CONSTRAINT doctor_patient_relationships_did_pid_key UNIQUE (did, pid),
    CONSTRAINT doctor_patient_relationships_did_fkey FOREIGN KEY (did) REFERENCES doctors (did) ON DELETE CASCADE,
    CONSTRAINT doctor_patient_relationships_pid_fkey FOREIGN KEY (pid) REFERENCES patients (pid) ON DELETE CASCADE,
    CONSTRAINT doctor_patient_relationships_relationship_status_check CHECK (
        relationship_status IN ('active', 'inactive')
    )
);


-- 4.8  APPOINTMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    aid UUID NOT NULL DEFAULT gen_random_uuid(),
    pid UUID NOT NULL,
    did UUID NOT NULL,
    mode VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    token_number INTEGER,
    queue_position INTEGER,
    estimated_wait_minutes INTEGER,
    meeting_link TEXT,
    meeting_id VARCHAR(255),
    meeting_password VARCHAR(100),
    chief_complaint TEXT NOT NULL,
    symptoms TEXT[],
    doctor_notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    call_started_at TIMESTAMPTZ,
    call_ended_at TIMESTAMPTZ,
    call_duration_minutes INTEGER,
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',

    CONSTRAINT appointments_pkey PRIMARY KEY (aid),
    CONSTRAINT appointments_mode_check CHECK (mode IN ('online', 'offline', 'in_person')),
    CONSTRAINT appointments_status_check CHECK (
        status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'rescheduled', 'in_progress', 'pending')
    )
);


-- 4.9  PRESCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prescriptions (
    prescription_id UUID NOT NULL DEFAULT gen_random_uuid(),
    aid UUID,
    pid UUID NOT NULL,
    did UUID NOT NULL,
    diagnosis TEXT NOT NULL,
    symptoms TEXT[],
    medicines JSONB NOT NULL,
    instructions TEXT,
    diet_advice TEXT,
    follow_up_date DATE,
    follow_up_notes TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_suggestions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_to_patient BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,

    CONSTRAINT prescriptions_pkey PRIMARY KEY (prescription_id),
    CONSTRAINT prescriptions_aid_fkey FOREIGN KEY (aid) REFERENCES appointments (aid) ON DELETE CASCADE,
    CONSTRAINT prescriptions_pid_fkey FOREIGN KEY (pid) REFERENCES patients (pid) ON DELETE CASCADE
);


-- 4.10 MEDICATION_ADHERENCE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medication_adherence (
    adherence_id UUID NOT NULL DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL,
    pid UUID NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    taken_at TIMESTAMPTZ,
    is_taken BOOLEAN DEFAULT FALSE,
    is_skipped BOOLEAN DEFAULT FALSE,
    skip_reason TEXT,
    synced BOOLEAN DEFAULT FALSE,
    device_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT medication_adherence_pkey PRIMARY KEY (adherence_id),
    CONSTRAINT medication_adherence_prescription_id_medicine_name_schedule_key UNIQUE (
        prescription_id, medicine_name, scheduled_date, scheduled_time
    ),
    CONSTRAINT medication_adherence_prescription_id_fkey FOREIGN KEY (prescription_id)
        REFERENCES prescriptions (prescription_id) ON DELETE CASCADE
);


-- 4.11 MEDICATION_REMINDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medication_reminders (
    reminder_id UUID NOT NULL DEFAULT gen_random_uuid(),
    adherence_id UUID NOT NULL,
    pid UUID NOT NULL,
    reminder_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notification_type VARCHAR(30) DEFAULT 'push',
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT medication_reminders_pkey PRIMARY KEY (reminder_id),
    CONSTRAINT medication_reminders_adherence_id_fkey FOREIGN KEY (adherence_id)
        REFERENCES medication_adherence (adherence_id) ON DELETE CASCADE,
    CONSTRAINT medication_reminders_pid_fkey FOREIGN KEY (pid)
        REFERENCES patients (pid) ON DELETE CASCADE,
    CONSTRAINT medication_reminders_notification_type_check CHECK (
        notification_type IN ('push', 'sms', 'email')
    ),
    CONSTRAINT medication_reminders_status_check CHECK (
        status IN ('pending', 'sent', 'acknowledged', 'dismissed')
    )
);


-- 4.12 FINANCE_TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    transaction_id UUID NOT NULL DEFAULT gen_random_uuid(),
    aid UUID,
    pid UUID NOT NULL,
    did UUID,
    transaction_type VARCHAR(30) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(500),
    payment_method VARCHAR(30),
    razorpay_response JSONB,
    description TEXT,
    initiated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT finance_transactions_pkey PRIMARY KEY (transaction_id),
    CONSTRAINT finance_transactions_razorpay_order_id_key UNIQUE (razorpay_order_id),
    CONSTRAINT finance_transactions_razorpay_payment_id_key UNIQUE (razorpay_payment_id),
    CONSTRAINT finance_transactions_status_check CHECK (
        status IN ('pending', 'paid', 'failed', 'refunded')
    ),
    CONSTRAINT finance_transactions_transaction_type_check CHECK (
        transaction_type IN ('consultation', 'refund', 'cancellation_charge')
    )
);


-- 4.13 RECEIPTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipts (
    receipt_id UUID NOT NULL DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pid UUID NOT NULL,
    did UUID NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    consultation_fee NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30),
    razorpay_payment_id VARCHAR(255),
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT receipts_pkey PRIMARY KEY (receipt_id),
    CONSTRAINT receipts_receipt_number_key UNIQUE (receipt_number),
    CONSTRAINT receipts_transaction_id_fkey FOREIGN KEY (transaction_id)
        REFERENCES finance_transactions (transaction_id) ON DELETE CASCADE
);


-- 4.14 MEDICINES (Marketplace)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    manufacturer TEXT,
    dosage TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT medicines_pkey PRIMARY KEY (id)
);


-- 4.15 CARTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT carts_pkey PRIMARY KEY (id),
    CONSTRAINT carts_user_id_key UNIQUE (user_id)
);


-- 4.16 CART_ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    medicine_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT cart_items_pkey PRIMARY KEY (id),
    CONSTRAINT cart_items_cart_id_medicine_id_key UNIQUE (cart_id, medicine_id),
    CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE,
    CONSTRAINT cart_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE
);


-- 4.17 ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    order_number VARCHAR(50),
    assigned_to_delivery_boy_id UUID,
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_notes TEXT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),

    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_order_number_key UNIQUE (order_number),
    CONSTRAINT orders_assigned_to_delivery_boy_id_fkey FOREIGN KEY (assigned_to_delivery_boy_id)
        REFERENCES delivery_agents (id),
    CONSTRAINT orders_status_check CHECK (
        status IN (
            'pending', 'paid',
            'PENDING_DELIVERY', 'ASSIGNED', 'ACCEPTED_FOR_DELIVERY',
            'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED_BY_DELIVERY'
        )
    )
);


-- 4.18 ORDER_ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    medicine_id UUID,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE SET NULL,
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);


-- 4.19 ORDER_STATUS_HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID,
    changed_by_role VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
    CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users (uid),
    CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);


-- 4.20 ORDER_DELIVERY_ASSIGNMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_delivery_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    delivery_boy_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT order_delivery_assignments_pkey PRIMARY KEY (id),
    CONSTRAINT order_delivery_assignments_order_id_key UNIQUE (order_id),
    CONSTRAINT order_delivery_assignments_delivery_boy_id_fkey FOREIGN KEY (delivery_boy_id)
        REFERENCES delivery_agents (id) ON DELETE CASCADE,
    CONSTRAINT order_delivery_assignments_order_id_fkey FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE
);


-- 4.21 IGNORED_ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ignored_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    delivery_boy_id UUID NOT NULL,
    ignored_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT ignored_orders_pkey PRIMARY KEY (id),
    CONSTRAINT ignored_orders_order_id_delivery_boy_id_key UNIQUE (order_id, delivery_boy_id),
    CONSTRAINT ignored_orders_delivery_boy_id_fkey FOREIGN KEY (delivery_boy_id)
        REFERENCES delivery_agents (id) ON DELETE CASCADE,
    CONSTRAINT ignored_orders_order_id_fkey FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE
);


-- 4.22 APP_TRANSLATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_translations (
    translation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT app_translations_pkey PRIMARY KEY (translation_id),
    CONSTRAINT app_translations_key_language_code_key UNIQUE (key, language_code)
);


-- 4.23 SYNC_QUEUE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_queue (
    sync_id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,
    data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    device_timestamp TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sync_queue_pkey PRIMARY KEY (sync_id),
    CONSTRAINT sync_queue_operation_check CHECK (operation IN ('create', 'update', 'delete')),
    CONSTRAINT sync_queue_status_check CHECK (status IN ('pending', 'synced', 'failed'))
);


-- ==============================================================================
-- SECTION 5: INDEXES
-- ==============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users USING btree (auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role);

-- Patients
CREATE INDEX IF NOT EXISTS idx_patients_uid ON public.patients USING btree (uid);
CREATE INDEX IF NOT EXISTS idx_patients_connected_doctors ON public.patients USING gin (connected_doctor_uids);

-- Clinics
CREATE INDEX IF NOT EXISTS idx_clinics_uid ON public.clinics USING btree (uid);

-- Doctors
CREATE INDEX IF NOT EXISTS idx_doctors_uid ON public.doctors USING btree (uid);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors USING btree (clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON public.doctors USING gin (specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_treated_patients ON public.doctors USING gin (treated_patient_uids);
CREATE INDEX IF NOT EXISTS idx_doctors_custom_specializations ON public.doctors USING gin (
    to_tsvector('english', custom_specializations)
);

-- Delivery Agents
CREATE INDEX IF NOT EXISTS idx_delivery_agents_uid ON public.delivery_agents USING btree (uid);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_auth_id ON public.delivery_agents USING btree (auth_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_active ON public.delivery_agents USING btree (is_active) WHERE is_active = TRUE;

-- Doctor Availability
CREATE INDEX IF NOT EXISTS idx_availability_did ON public.doctor_availability USING btree (did);
CREATE INDEX IF NOT EXISTS idx_availability_day ON public.doctor_availability USING btree (day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_active ON public.doctor_availability USING btree (is_active);

-- Doctor-Patient Relationships
CREATE INDEX IF NOT EXISTS idx_relationships_did ON public.doctor_patient_relationships USING btree (did);
CREATE INDEX IF NOT EXISTS idx_relationships_pid ON public.doctor_patient_relationships USING btree (pid);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON public.doctor_patient_relationships USING btree (relationship_status);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_pid ON public.appointments USING btree (pid);
CREATE INDEX IF NOT EXISTS idx_appointments_did ON public.appointments USING btree (did);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments USING btree (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_appointments_mode ON public.appointments USING btree (mode);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON public.appointments USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_did_date_status ON public.appointments USING btree (did, scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_pid_date_status ON public.appointments USING btree (pid, scheduled_date, status);

-- Prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_aid ON public.prescriptions USING btree (aid);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pid ON public.prescriptions USING btree (pid);
CREATE INDEX IF NOT EXISTS idx_prescriptions_did ON public.prescriptions USING btree (did);
CREATE INDEX IF NOT EXISTS idx_prescriptions_active ON public.prescriptions USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pid_active ON public.prescriptions USING btree (pid, is_active);
CREATE INDEX IF NOT EXISTS idx_prescriptions_sent ON public.prescriptions USING btree (sent_to_patient, sent_at);

-- Medication Adherence
CREATE INDEX IF NOT EXISTS idx_adherence_prescription ON public.medication_adherence USING btree (prescription_id);
CREATE INDEX IF NOT EXISTS idx_adherence_pid ON public.medication_adherence USING btree (pid);
CREATE INDEX IF NOT EXISTS idx_adherence_date ON public.medication_adherence USING btree (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_adherence_synced ON public.medication_adherence USING btree (synced);
CREATE INDEX IF NOT EXISTS idx_adherence_pid_date_taken ON public.medication_adherence USING btree (pid, scheduled_date, is_taken);
CREATE INDEX IF NOT EXISTS idx_adherence_pid_date_time ON public.medication_adherence USING btree (pid, scheduled_date, scheduled_time) WHERE is_taken = FALSE;

-- Medication Reminders
CREATE INDEX IF NOT EXISTS idx_reminders_adherence ON public.medication_reminders USING btree (adherence_id);
CREATE INDEX IF NOT EXISTS idx_reminders_pid ON public.medication_reminders USING btree (pid);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.medication_reminders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON public.medication_reminders USING btree (reminder_time);

-- Finance Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_pid ON public.finance_transactions USING btree (pid);
CREATE INDEX IF NOT EXISTS idx_transactions_aid ON public.finance_transactions USING btree (aid);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.finance_transactions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order ON public.finance_transactions USING btree (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_payment ON public.finance_transactions USING btree (razorpay_payment_id);

-- Medicines
CREATE INDEX IF NOT EXISTS medicines_name_idx ON public.medicines USING btree (name);
CREATE INDEX IF NOT EXISTS medicines_category_idx ON public.medicines USING btree (category);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders USING btree (user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders USING btree (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_boy ON public.orders USING btree (assigned_to_delivery_boy_id) WHERE assigned_to_delivery_boy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_pending_delivery ON public.orders USING btree (status) WHERE status = 'PENDING_DELIVERY';

-- Order Status History
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON public.order_status_history USING btree (created_at);

-- Order Delivery Assignments
CREATE INDEX IF NOT EXISTS idx_order_delivery_assignments_order ON public.order_delivery_assignments USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_delivery_assignments_delivery_boy ON public.order_delivery_assignments USING btree (delivery_boy_id);

-- Ignored Orders
CREATE INDEX IF NOT EXISTS idx_ignored_orders_order ON public.ignored_orders USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_ignored_orders_delivery_boy ON public.ignored_orders USING btree (delivery_boy_id);

-- Sync Queue
CREATE INDEX IF NOT EXISTS idx_sync_user ON public.sync_queue USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_status ON public.sync_queue USING btree (status);


-- ==============================================================================
-- SECTION 6: TRIGGERS
-- ==============================================================================

-- ---- USERS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_validate_user_role_change ON users;
CREATE TRIGGER trigger_validate_user_role_change
    BEFORE UPDATE OF role ON users
    FOR EACH ROW EXECUTE FUNCTION validate_user_role_change();

DROP TRIGGER IF EXISTS enforce_delivery_boy_role_isolation ON users;
CREATE TRIGGER enforce_delivery_boy_role_isolation
    BEFORE UPDATE OF role ON users
    FOR EACH ROW EXECUTE FUNCTION prevent_delivery_boy_role_change();

DROP TRIGGER IF EXISTS sync_user_role_on_insert ON users;
CREATE TRIGGER sync_user_role_on_insert
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION sync_user_role_tables();

DROP TRIGGER IF EXISTS sync_user_role_on_update ON users;
CREATE TRIGGER sync_user_role_on_update
    AFTER UPDATE OF role ON users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION sync_user_role_tables();

DROP TRIGGER IF EXISTS trigger_auto_insert_user_role ON users;
CREATE TRIGGER trigger_auto_insert_user_role
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION auto_insert_user_role();

DROP TRIGGER IF EXISTS trigger_auto_manage_user_roles ON users;
CREATE TRIGGER trigger_auto_manage_user_roles
    AFTER INSERT OR UPDATE OF role ON users
    FOR EACH ROW EXECUTE FUNCTION auto_manage_user_roles();

DROP TRIGGER IF EXISTS trigger_auto_create_delivery_agent ON users;
CREATE TRIGGER trigger_auto_create_delivery_agent
    AFTER INSERT OR UPDATE OF role ON users
    FOR EACH ROW
    WHEN (NEW.role = 'delivery_boy')
    EXECUTE FUNCTION auto_create_delivery_agent();

DROP TRIGGER IF EXISTS trigger_sync_user_data ON users;
CREATE TRIGGER trigger_sync_user_data
    AFTER UPDATE OF name, email, phone ON users
    FOR EACH ROW EXECUTE FUNCTION sync_user_updates();

DROP TRIGGER IF EXISTS trigger_sync_user_name ON users;
CREATE TRIGGER trigger_sync_user_name
    AFTER UPDATE OF name ON users
    FOR EACH ROW EXECUTE FUNCTION sync_user_name_changes();


-- ---- PATIENTS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_enforce_patient_role ON patients;
CREATE TRIGGER trigger_enforce_patient_role
    BEFORE INSERT OR UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION enforce_patient_role();


-- ---- CLINICS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
    BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_sync_clinic_details ON clinics;
CREATE TRIGGER trigger_sync_clinic_details
    AFTER UPDATE OF clinic_name ON clinics
    FOR EACH ROW EXECUTE FUNCTION sync_clinic_name_to_doctors();


-- ---- DOCTORS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_enforce_doctor_role ON doctors;
CREATE TRIGGER trigger_enforce_doctor_role
    BEFORE INSERT OR UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION enforce_doctor_role();


-- ---- DELIVERY_AGENTS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS trigger_enforce_delivery_agent_role ON delivery_agents;
CREATE TRIGGER trigger_enforce_delivery_agent_role
    BEFORE INSERT OR UPDATE ON delivery_agents
    FOR EACH ROW EXECUTE FUNCTION enforce_delivery_agent_role();


-- ---- DOCTOR_AVAILABILITY TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_availability_updated_at ON doctor_availability;
CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---- DOCTOR_PATIENT_RELATIONSHIPS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_relationships_updated_at ON doctor_patient_relationships;
CREATE TRIGGER update_relationships_updated_at
    BEFORE UPDATE ON doctor_patient_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ---- APPOINTMENTS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS generate_token_number_trigger ON appointments;
CREATE TRIGGER generate_token_number_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION generate_token_number();

DROP TRIGGER IF EXISTS trigger_update_relationship ON appointments;
CREATE TRIGGER trigger_update_relationship
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_doctor_patient_relationship();


-- ---- PRESCRIPTIONS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_auto_create_adherence ON prescriptions;
CREATE TRIGGER trigger_auto_create_adherence
    AFTER UPDATE OF sent_to_patient ON prescriptions
    FOR EACH ROW
    WHEN (OLD.sent_to_patient IS DISTINCT FROM NEW.sent_to_patient AND NEW.sent_to_patient = TRUE)
    EXECUTE FUNCTION auto_create_adherence_records();


-- ---- RECEIPTS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS generate_receipt_number_trigger ON receipts;
CREATE TRIGGER generate_receipt_number_trigger
    BEFORE INSERT ON receipts
    FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();


-- ---- ORDERS TABLE TRIGGERS ----
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

DROP TRIGGER IF EXISTS trigger_track_order_status ON orders;
CREATE TRIGGER trigger_track_order_status
    AFTER UPDATE OF status ON orders
    FOR EACH ROW EXECUTE FUNCTION track_order_status_change();

DROP TRIGGER IF EXISTS trigger_update_delivery_stats ON orders;
CREATE TRIGGER trigger_update_delivery_stats
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'DELIVERED')
    EXECUTE FUNCTION update_delivery_stats();


-- ==============================================================================
-- SECTION 7: VIEWS & MATERIALIZED VIEWS
-- ==============================================================================

-- 7.1  ADHERENCE_PROGRESS (regular view)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.adherence_progress AS
SELECT
    pid,
    prescription_id,
    medicine_name,
    COUNT(*) AS total_doses,
    SUM(CASE WHEN is_taken THEN 1 ELSE 0 END) AS taken_doses,
    SUM(CASE WHEN is_skipped THEN 1 ELSE 0 END) AS skipped_doses,
    ROUND(
        SUM(CASE WHEN is_taken THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2
    ) AS adherence_percentage
FROM medication_adherence
GROUP BY pid, prescription_id, medicine_name;


-- 7.2  ADHERENCE_PROGRESS_SUMMARY (materialized view)
-- Note: DROP + CREATE because materialized views don't support CREATE OR REPLACE
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'adherence_progress_summary'
    ) THEN
        EXECUTE '
        CREATE MATERIALIZED VIEW public.adherence_progress_summary AS
        SELECT
            ma.pid,
            ma.prescription_id,
            p.did,
            ma.medicine_name,
            COUNT(*) AS total_doses,
            SUM(CASE WHEN ma.is_taken THEN 1 ELSE 0 END) AS taken_doses,
            SUM(CASE WHEN ma.is_skipped THEN 1 ELSE 0 END) AS skipped_doses,
            ROUND(
                SUM(CASE WHEN ma.is_taken THEN 1 ELSE 0 END)::NUMERIC
                / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2
            ) AS adherence_percentage,
            MIN(ma.scheduled_date) AS start_date,
            MAX(ma.scheduled_date) AS end_date,
            MAX(ma.updated_at) AS last_updated
        FROM medication_adherence ma
        JOIN prescriptions p ON ma.prescription_id = p.prescription_id
        WHERE p.is_active = TRUE
        GROUP BY ma.pid, ma.prescription_id, p.did, ma.medicine_name
        ';
    END IF;
END;
$$;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_adherence_summary_unique
ON adherence_progress_summary (pid, prescription_id, did, medicine_name);


-- Trigger to auto-refresh the materialized view
-- (must be created AFTER the materialized view exists)
DROP TRIGGER IF EXISTS trigger_refresh_adherence_summary ON medication_adherence;
CREATE TRIGGER trigger_refresh_adherence_summary
    AFTER INSERT OR UPDATE OR DELETE ON medication_adherence
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_adherence_summary();


-- ==============================================================================
-- SECTION 8: TABLE COMMENTS
-- ==============================================================================

COMMENT ON TABLE users IS 'Central user table for all platform roles (patient, doctor, admin, clinic, delivery_boy)';
COMMENT ON TABLE patients IS 'Patient profiles linked to users, stores medical history and demographics';
COMMENT ON TABLE doctors IS 'Doctor profiles with qualifications, specializations, and clinic affiliation';
COMMENT ON TABLE clinics IS 'Clinic profiles for multi-doctor practice management';
COMMENT ON TABLE delivery_agents IS 'Delivery personnel profiles with stats and availability';
COMMENT ON TABLE appointments IS 'Patient-doctor appointments with online/offline modes';
COMMENT ON TABLE prescriptions IS 'Prescriptions with AI-assisted medicine recommendations';
COMMENT ON TABLE medication_adherence IS 'Tracks daily medication adherence for each medicine dose';
COMMENT ON TABLE medication_reminders IS 'Push/SMS/email reminders for medication doses';
COMMENT ON TABLE finance_transactions IS 'Payment transactions via Razorpay for consultations';
COMMENT ON TABLE receipts IS 'Auto-generated payment receipts';
COMMENT ON TABLE medicines IS 'Ayurvedic medicine catalog for the marketplace';
COMMENT ON TABLE orders IS 'Marketplace orders with delivery status tracking';
COMMENT ON TABLE order_items IS 'Individual items within a marketplace order';
COMMENT ON TABLE order_status_history IS 'Audit trail of order status transitions';
COMMENT ON TABLE order_delivery_assignments IS 'Maps delivery agents to orders';
COMMENT ON TABLE ignored_orders IS 'Tracks orders ignored/skipped by delivery agents';
COMMENT ON TABLE carts IS 'Shopping carts for marketplace users';
COMMENT ON TABLE cart_items IS 'Items in a shopping cart';
COMMENT ON TABLE doctor_availability IS 'Weekly schedule slots for doctor appointments';
COMMENT ON TABLE doctor_patient_relationships IS 'Tracks ongoing doctor-patient relationships';
COMMENT ON TABLE app_translations IS 'i18n translations for multi-language support';
COMMENT ON TABLE sync_queue IS 'Offline-first sync queue for mobile data';

COMMENT ON FUNCTION auto_create_adherence_records() IS 'Auto-creates medication adherence tracking records when a prescription is sent to a patient';
COMMENT ON FUNCTION auto_manage_user_roles() IS 'Ensures role-specific table records exist when users are created or roles change';
COMMENT ON FUNCTION track_order_status_change() IS 'Logs order status transitions to order_status_history audit table';


-- ==============================================================================
-- SECTION 9: NHOST STORAGE BUCKET SETUP
-- ==============================================================================
-- This configures Nhost storage buckets for profile images and file uploads.
-- Only run this if using Nhost as the backend provider.
-- If using a different storage provider, skip this section.

-- INSERT INTO storage.buckets (id, presigned_urls_enabled, max_upload_file_size, min_upload_file_size, cache_control)
-- VALUES
--   ('avatars', true, 5242880, 1, 'max-age=3600'),
--   ('logos', true, 5242880, 1, 'max-age=3600'),
--   ('default', true, 50000000, 1, 'max-age=3600')
-- ON CONFLICT (id) DO UPDATE SET
--   presigned_urls_enabled = EXCLUDED.presigned_urls_enabled,
--   max_upload_file_size = EXCLUDED.max_upload_file_size;


-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- Tables:               23
-- Functions:            21
-- Triggers:             33
-- Views:                 1
-- Materialized Views:    1
-- Indexes:              65+
-- Sequences:             2
-- ==============================================================================
