package com.contact_managment.main_application.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a duplicate phone number is detected within a contact or across existing contacts.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicatePhoneNumberException extends RuntimeException {

    public DuplicatePhoneNumberException(String message) {
        super(message);
    }
}
