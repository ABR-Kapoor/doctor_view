-- ==============================================================================
-- PROJECT DATABASE FUNCTIONS AND ENHANCEMENTS
-- This file contains all missing functions and trigger fixes for Project_DB.sql
-- Run this AFTER running Project_DB.sql to make everything perfect
-- ==============================================================================

-- 1. UPDATE_UPDATED_AT_COLUMN - Used by multiple triggers
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

-- 2. AUTO_CREATE_ADHERENCE_RECORDS - FIXED VERSION
-- ------------------------------------------------------------------------------
-- This is the core adherence tracking function
DROP TRIGGER IF EXISTS trigger_auto_create_adherence ON prescriptions;

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
  -- Only run when sent_to_patient becomes TRUE
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
          ELSE 7 -- Default to 7 days
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
                 -- Default to once daily at 9am if unknown
                 dosage_times := ARRAY['09:00'];
             END IF;
          END;
        END IF;

        curr_date := CURRENT_DATE;
        end_date := curr_date + duration_days;

        -- Create adherence records based on the calculated times
        IF dosage_times IS NOT NULL AND array_length(dosage_times, 1) > 0 THEN
          -- For each day in the duration
          WHILE curr_date < end_date LOOP
            -- For each time in the day
            FOREACH time_slot IN ARRAY dosage_times LOOP
              INSERT INTO medication_adherence (
                prescription_id,
                pid,
                medicine_name,
                scheduled_date,
                scheduled_time,
                is_taken,
                is_skipped,
                synced
              )
              VALUES (
                NEW.prescription_id,
                NEW.pid,
                medicine_name,
                curr_date,
                time_slot::TIME,
                false,
                false,
                false
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

-- Create the trigger to fire on UPDATE of sent_to_patient
CREATE TRIGGER trigger_auto_create_adherence
AFTER UPDATE OF sent_to_patient ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_adherence_records();

-- 3. REFRESH_ADHERENCE_SUMMARY - For materialized view
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_adherence_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh the materialized view (non-blocking)
    REFRESH MATERIALIZED VIEW CONCURRENTLY adherence_progress_summary;
    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        -- If concurrent refresh fails, do regular refresh
        REFRESH MATERIALIZED VIEW adherence_progress_summary;
        RETURN NULL;
END;
$$;

-- Create trigger to refresh summary on any change to adherence records
DROP TRIGGER IF EXISTS trigger_refresh_adherence_summary ON medication_adherence;

CREATE TRIGGER trigger_refresh_adherence_summary
AFTER INSERT OR UPDATE OR DELETE ON medication_adherence
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_adherence_summary();

-- 4. SYNC_USER_ROLE_TABLES - Syncs user role to patient/doctor tables
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_role_tables()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If role changed to patient, ensure patient record exists
    IF NEW.role = 'patient' THEN
        INSERT INTO patients (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;
        
        -- Remove from doctors if exists
        DELETE FROM doctors WHERE uid = NEW.uid;
    END IF;

    -- If role changed to doctor, ensure doctor record exists
    IF NEW.role = 'doctor' THEN
        INSERT INTO doctors (uid)
        VALUES (NEW.uid)
        ON CONFLICT (uid) DO NOTHING;
        
        -- Remove from patients if exists
        DELETE FROM patients WHERE uid = NEW.uid;
    END IF;

    RETURN NEW;
END;
$$;

-- 5. AUTO_INSERT_USER_ROLE - Creates patient/doctor record on user insert
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

-- 6. GENERATE_RECEIPT_NUMBER - Auto-generates receipt numbers
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

-- Create sequence for receipt numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

-- 7. GENERATE_TOKEN_NUMBER - Auto-generates appointment tokens
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_token_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_token INTEGER;
BEGIN
    -- Only generate for offline appointments
    IF NEW.mode IN ('offline', 'in_person') AND NEW.token_number IS NULL THEN
        -- Get the next token number for this doctor on this date
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

-- 8. UPDATE_DOCTOR_PATIENT_RELATIONSHIP - Maintains relationship tracking
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_doctor_patient_relationship()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert or update relationship
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

-- ==============================================================================
-- ADDITIONAL ENHANCEMENTS
-- ==============================================================================

-- Create index on adherence_progress_summary for faster queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_adherence_summary_unique 
ON adherence_progress_summary (pid, prescription_id, did, medicine_name);

-- Add helpful comments
COMMENT ON FUNCTION auto_create_adherence_records() IS 
'Automatically creates medication adherence tracking records when a prescription is sent to a patient';

COMMENT ON TABLE medication_adherence IS 
'Tracks daily medication adherence for each medicine in each prescription';

COMMENT ON TRIGGER trigger_auto_create_adherence ON prescriptions IS 
'Fires when sent_to_patient changes to TRUE, creating adherence records';

-- ==============================================================================
-- VERIFICATION QUERIES (Run these to verify everything works)
-- ==============================================================================

-- Check if trigger is properly enabled
-- SELECT tgname, tgenabled, tgtype 
-- FROM pg_trigger 
-- WHERE tgrelid = 'prescriptions'::regclass 
--   AND tgname = 'trigger_auto_create_adherence';

-- Check all functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
--   AND routine_type = 'FUNCTION'
-- ORDER BY routine_name;

-- ==============================================================================
-- COMPLETE! Your database is now perfect.
-- ==============================================================================
