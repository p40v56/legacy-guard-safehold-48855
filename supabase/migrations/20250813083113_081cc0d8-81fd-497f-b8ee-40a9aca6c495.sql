-- Check current constraint on contacts table and fix contact type validation
DO $$ 
BEGIN
    -- Check if the contact_type column has a check constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'contacts' 
        AND constraint_type = 'CHECK' 
        AND constraint_name LIKE '%contact_type%'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_contact_type_check;
    END IF;
    
    -- Add the correct check constraint with the right values
    ALTER TABLE contacts 
    ADD CONSTRAINT contacts_contact_type_check 
    CHECK (contact_type IN ('immediate_family', 'extended_family', 'close_friends', 'professional', 'legal', 'financial'));
END $$;