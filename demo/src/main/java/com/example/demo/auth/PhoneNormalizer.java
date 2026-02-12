package com.example.demo.auth;

/**
 * Normalizes phone numbers so that lookup by "0549966847" matches users
 * stored as "+972549966847" (E.164 from the phone login form).
 */
public final class PhoneNormalizer {

    private PhoneNormalizer() {}

    /**
     * Normalize to a canonical form for storage and lookup.
     * Israeli local format (0 + 9 digits) is converted to E.164 (+972 + 9 digits).
     * Input that already looks like E.164 is returned trimmed; other input is returned trimmed as-is.
     */
    public static String normalize(String phone) {
        if (phone == null) return "";
        String trimmed = phone.trim();
        if (trimmed.isEmpty()) return "";
        String digits = trimmed.replaceAll("\\D", "");
        // Israeli local: 10 digits starting with 0 (e.g. 0549966847) -> +972549966847
        if (digits.length() == 10 && digits.startsWith("0")) {
            return "+972" + digits.substring(1);
        }
        // Already with country code but no + (e.g. 972549966847) -> add +
        if (digits.length() == 12 && digits.startsWith("972")) {
            return "+" + digits;
        }
        return trimmed;
    }
}
