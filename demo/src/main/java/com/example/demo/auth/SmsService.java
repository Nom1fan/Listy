package com.example.demo.auth;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsService {

    @Value("${listy.twilio.account-sid:}")
    private String accountSid;

    @Value("${listy.twilio.auth-token:}")
    private String authToken;

    @Value("${listy.twilio.from-number:}")
    private String fromNumber;

    public void sendOtp(String toPhone, String code) {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
            log.warn("Twilio not configured; skipping SMS. OTP for {} would be: {}", toPhone, code);
            return;
        }
        try {
            Twilio.init(accountSid, authToken);
            Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(fromNumber),
                    "Listy: הקוד שלך הוא " + code
            ).create();
        } catch (Exception e) {
            log.error("Failed to send SMS to {}", toPhone, e);
            throw new RuntimeException("Failed to send SMS", e);
        }
    }
}
