package com.listyyy.backend.exception;

/**
 * Helper for optimistic-locking version checks.
 * Call before saving an entity when the client sends a version.
 */
public final class VersionCheck {

    private static final String DEFAULT_MESSAGE = "הנתונים עודכנו על ידי משתמש אחר. רענן ונסה שוב.";

    private VersionCheck() {}

    /**
     * Throws {@link StaleDataException} if the client version doesn't match the entity version.
     *
     * @param clientVersion version sent by the client (null = skip check)
     * @param entityVersion current entity version from the database
     */
    public static void check(Long clientVersion, Long entityVersion) {
        if (clientVersion != null && !clientVersion.equals(entityVersion)) {
            throw new StaleDataException(DEFAULT_MESSAGE);
        }
    }
}
