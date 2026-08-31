package com.contact_managment.main_application.exception;

/**
 * Exception thrown when authentication fails due to incorrect credentials or unauthenticated principal access.
 */
public class InvalidCredentialsException extends RuntimeException {

    /**
     * Constructs a new InvalidCredentialsException with the specified error message.
     *
     * @param message error description
     */
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
