package com.contact_managment.main_application.exception;

/**
 * Exception thrown when attempting to register a user with an email or phone number that already exists.
 */
public class UserAlreadyExistsException extends RuntimeException {

    /**
     * Constructs a new UserAlreadyExistsException with the specified error message.
     *
     * @param message error description
     */
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
