package com.contact_managment.main_application.exception;

/**
 * Exception thrown when a requested resource (such as a User or Contact) is not found in the database.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Constructs a new ResourceNotFoundException with the specified error message.
     *
     * @param message error description
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
