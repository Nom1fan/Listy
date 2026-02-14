-- Make phone nullable in otp_request_log so email-only OTP requests can be logged
ALTER TABLE otp_request_log ALTER COLUMN phone DROP NOT NULL;
