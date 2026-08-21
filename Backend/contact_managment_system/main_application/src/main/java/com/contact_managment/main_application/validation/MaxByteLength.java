package com.contact_managment.main_application.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that a string's UTF-8 byte length does not exceed the specified maximum.
 */
@Documented
@Constraint(validatedBy = MaxByteLengthValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface MaxByteLength {

    String message() default "Value exceeds maximum byte length";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    int max() default 72;
}
