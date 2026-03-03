-- Clear all existing rows (user will re-upload both firms)
TRUNCATE TABLE invoices;

-- Add firm column
ALTER TABLE invoices ADD COLUMN firm text NOT NULL;

-- Drop the existing unique constraint on invoice_no
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_no_key;

-- Create a new composite unique constraint
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_no_firm_key UNIQUE (invoice_no, firm);
