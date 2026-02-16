package com.listyyy.backend.exception;

/**
 * Thrown when a client sends a stale version for optimistic locking.
 * The entity was modified by another user since the client last fetched it.
 */
public class StaleDataException extends RuntimeException {
    public StaleDataException(String message) {
        super(message);
    }
}
