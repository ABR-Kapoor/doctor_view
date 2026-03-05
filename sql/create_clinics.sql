-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync clinic name to doctors table
CREATE OR REPLACE FUNCTION sync_clinic_name_to_doctors()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE doctors
    SET clinic_name = NEW.clinic_name
    WHERE clinic_id = NEW.clinic_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
  clinic_id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  uid uuid NOT NULL,
  clinic_name character varying(255) NOT NULL,
  registration_number character varying(100) NULL,
  address_line1 character varying(255) NULL,
  address_line2 character varying(255) NULL,
  city character varying(100) NULL,
  state character varying(100) NULL,
  country character varying(100) NULL DEFAULT 'India'::character varying,
  postal_code character varying(20) NULL,
  phone character varying(20) NULL,
  email character varying(255) NULL,
  website character varying(255) NULL,
  description text NULL,
  logo_url text NULL,
  is_verified boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clinics_pkey PRIMARY KEY (clinic_id),
  CONSTRAINT clinics_registration_number_key UNIQUE (registration_number),
  CONSTRAINT clinics_uid_key UNIQUE (uid),
  CONSTRAINT clinics_uid_fkey FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create index
CREATE INDEX IF NOT EXISTS idx_clinics_uid ON public.clinics USING btree (uid) TABLESPACE pg_default;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_sync_clinic_details ON clinics;
CREATE TRIGGER trigger_sync_clinic_details
AFTER UPDATE OF clinic_name ON clinics FOR EACH ROW
EXECUTE FUNCTION sync_clinic_name_to_doctors();

DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
