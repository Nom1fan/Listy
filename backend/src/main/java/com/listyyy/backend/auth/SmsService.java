package com.listyyy.backend.auth;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsService {

    @Value("${listyyy.twilio.account-sid:}")
    private String accountSid;

    @Value("${listyyy.twilio.auth-token:}")
    private String authToken;

    @Value("${listyyy.twilio.from-number:}")
    private String fromNumber;

    private boolean configured;

    @PostConstruct
    void init() {
        configured = accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank();
        if (configured) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio initialised (from={})", fromNumber);
        } else {
            log.warn("Twilio credentials not set – SMS sending is disabled");
        }
    }

    public void sendOtp(String toPhone, String code) {
        if (!configured) {
            log.warn("Twilio not configured; skipping SMS. OTP for {} would be: {}", toPhone, code);
            return;
        }
        try {
            Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(fromNumber),
                    "Listyyy: הקוד שלך הוא " + code
            ).create();
        } catch (Exception e) {
            log.error("Failed to send SMS to {}", toPhone, e);
            throw new RuntimeException("שליחת SMS נכשלה", e);
        }
    }
}
