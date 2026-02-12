-- Log OTP requests for rate limiting (e.g. max 5 per phone per hour)
CREATE TABLE otp_request_log (
    phone VARCHAR(20) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_request_log_phone_time ON otp_request_log(phone, requested_at);
