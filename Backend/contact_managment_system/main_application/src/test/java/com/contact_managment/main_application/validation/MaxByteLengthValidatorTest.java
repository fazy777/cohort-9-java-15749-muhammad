package com.contact_managment.main_application.validation;

import jakarta.validation.Payload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.annotation.Annotation;

import static org.junit.jupiter.api.Assertions.*;

class MaxByteLengthValidatorTest {

    private MaxByteLengthValidator validator;

    @BeforeEach
    void setUp() {
        validator = new MaxByteLengthValidator();
        validator.initialize(new MaxByteLength() {
            @Override
            public Class<? extends Annotation> annotationType() {
                return MaxByteLength.class;
            }

            @Override
            public String message() {
                return "Value exceeds maximum byte length";
            }

            @Override
            public Class<?>[] groups() {
                return new Class<?>[0];
            }

            @Override
            public Class<? extends Payload>[] payload() {
                return new Class[0];
            }

            @Override
            public int max() {
                return 72;
            }
        });
    }

    @Test
    @DisplayName("Should accept null value")
    void isValid_NullValue_ReturnsTrue() {
        assertTrue(validator.isValid(null, null));
    }

    @Test
    @DisplayName("Should accept empty string")
    void isValid_EmptyString_ReturnsTrue() {
        assertTrue(validator.isValid("", null));
    }

    @Test
    @DisplayName("Should accept ASCII password within 72 bytes")
    void isValid_ValidAsciiPassword_ReturnsTrue() {
        assertTrue(validator.isValid("ValidPassword123!", null));
        assertTrue(validator.isValid("a".repeat(72), null));
    }

    @Test
    @DisplayName("Should reject ASCII password exceeding 72 bytes")
    void isValid_OverlongAsciiPassword_ReturnsFalse() {
        assertFalse(validator.isValid("a".repeat(73), null));
    }

    @Test
    @DisplayName("Should reject multi-byte UTF-8 password exceeding 72 bytes even if character length <= 72")
    void isValid_OverlongUtf8Password_ReturnsFalse() {
        // 20 4-byte emoji characters = 80 bytes (length is only 20 code points / 40 UTF-16 chars)
        String overlongEmoji = "🔒".repeat(20);
        assertFalse(validator.isValid(overlongEmoji, null));
    }

    @Test
    @DisplayName("Should accept multi-byte UTF-8 password within 72 bytes")
    void isValid_ValidUtf8Password_ReturnsTrue() {
        // 18 4-byte emoji characters = 72 bytes
        String validEmoji = "🔒".repeat(18);
        assertTrue(validator.isValid(validEmoji, null));
    }
}
