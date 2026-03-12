-- Add contact person fields to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_phone TEXT;
