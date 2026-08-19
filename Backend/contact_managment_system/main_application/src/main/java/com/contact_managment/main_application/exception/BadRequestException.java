package com.contact_managment.main_application.exception;

/**
 * Exception thrown when a client request contains invalid parameters, malformed data, or violates business constraints.
 */
public class BadRequestException extends RuntimeException {

    /**
     * Constructs a new BadRequestException with the specified error message.
     *
     * @param message error description
     */
    public BadRequestException(String message) {
        super(message);
    }
}
