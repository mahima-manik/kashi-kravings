-- Add password_hash column for store owner login
ALTER TABLE stores ADD COLUMN password_hash text;

-- Ensure phone numbers are unique (only for non-null values) so login lookups are unambiguous
CREATE UNIQUE INDEX stores_contact_phone_unique ON stores(contact_phone) WHERE contact_phone IS NOT NULL;
