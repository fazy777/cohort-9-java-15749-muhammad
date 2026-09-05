package com.contact_managment.main_application.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a duplicate phone number is detected within a contact or across existing contacts.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicatePhoneNumberException extends RuntimeException {

    private final int strike;
    private final boolean accountClosed;
    private final String duplicateNumber;

    public DuplicatePhoneNumberException(String message) {
        this(message, 1, false, null);
    }

    public DuplicatePhoneNumberException(String message, int strike, boolean accountClosed, String duplicateNumber) {
        super(message);
        this.strike = strike;
        this.accountClosed = accountClosed;
        this.duplicateNumber = duplicateNumber;
    }

    public int getStrike() {
        return strike;
    }

    public boolean isAccountClosed() {
        return accountClosed;
    }

    public String getDuplicateNumber() {
        return duplicateNumber;
    }
}
