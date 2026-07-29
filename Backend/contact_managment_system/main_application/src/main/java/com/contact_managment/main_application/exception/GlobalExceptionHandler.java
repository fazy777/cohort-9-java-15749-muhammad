package com.contact_managment.main_application.exception;

import com.contact_managment.main_application.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

/**
 * Global exception handler providing centralized exception handling
 * with proper logging and null safety. Fixes HIGH priority CodeRabbit issue.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles ResourceNotFoundException.
     *
     * @param ex      exception, must not be null
     * @param request web request, must not be null
     * @return error response entity
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        Objects.requireNonNull(ex, "exception must not be null");
        Objects.requireNonNull(request, "request must not be null");

        logger.warn("Resource not found: {}", ex.getMessage());
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(false)
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Handles validation exceptions with detailed field errors.
     *
     * @param ex validation exception
     * @return bad request response with field errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Objects.requireNonNull(ex, "exception must not be null");

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            if (fieldName != null && errorMessage != null) {
                errors.put(fieldName, errorMessage);
            }
        });

        logger.warn("Validation failed with {} errors", errors.size());
        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .data(errors)
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles constraint violation exceptions.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolationException(
            ConstraintViolationException ex) {
        Objects.requireNonNull(ex, "exception must not be null");
        logger.warn("Constraint violation: {}", ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error("Constraint violation: " + ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles IllegalArgumentException - often from null checks.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        Objects.requireNonNull(ex, "exception must not be null");
        Objects.requireNonNull(request, "request must not be null");

        logger.warn("Invalid argument: {}", ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error(ex.getMessage() != null ? ex.getMessage() : "Invalid argument");
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles all other uncaught exceptions - prevents stack trace leakage.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(
            Exception ex, WebRequest request) {
        Objects.requireNonNull(ex, "exception must not be null");
        Objects.requireNonNull(request, "request must not be null");

        logger.error("Unhandled exception at {}: {}", request.getContextPath(), ex.getMessage(), ex);
        ApiResponse<Void> response = ApiResponse.error(
                "An unexpected error occurred. Please try again later.");
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
