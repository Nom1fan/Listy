-- Fix otp_request_log created without id column (V2 before it was updated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'otp_request_log' AND column_name = 'id'
    ) THEN
        ALTER TABLE otp_request_log ADD COLUMN id BIGSERIAL PRIMARY KEY;
    END IF;
END $$;
