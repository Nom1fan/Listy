-- Email OTP table (mirrors phone_otp)
CREATE TABLE email_otp (
    email VARCHAR(320) NOT NULL PRIMARY KEY,
    code  VARCHAR(10)  NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Allow otp_request_log to track email requests too
ALTER TABLE otp_request_log ADD COLUMN email VARCHAR(320);
CREATE INDEX idx_otp_request_log_email_time ON otp_request_log(email, requested_at);
