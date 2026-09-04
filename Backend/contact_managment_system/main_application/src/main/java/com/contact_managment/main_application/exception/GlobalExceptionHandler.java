package com.contact_managment.main_application.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Central advice component intercepting uncaught application exceptions and mapping them to structured JSON ErrorResponse objects.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Sanitizes input strings before writing to application logs to prevent CRLF log injection (CWE-117).
     *
     * @param input the raw string
     * @return sanitized string with CRLF and control characters stripped
     */
    private String sanitizeForLog(String input) {
        if (input == null) {
            return "";
        }
        return input.replaceAll("[\r\n\t]", "_");
    }

    /**
     * Handles ResourceNotFoundException and returns HTTP 404 Not Found.
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found exception at {}: {}", sanitizeForLog(request.getRequestURI()), sanitizeForLog(ex.getMessage()));
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /**
     * Handles UserAlreadyExistsException and returns HTTP 409 Conflict.
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExistsException(UserAlreadyExistsException ex, HttpServletRequest request) {
        log.warn("User conflict at {}: {}", sanitizeForLog(request.getRequestURI()), sanitizeForLog(ex.getMessage()));
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handles DuplicatePhoneNumberException and returns HTTP 409 Conflict.
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(DuplicatePhoneNumberException.class)
    public ResponseEntity<ErrorResponse> handleDuplicatePhoneNumberException(DuplicatePhoneNumberException ex, HttpServletRequest request) {
        log.warn("Duplicate phone number exception at {}: {}", sanitizeForLog(request.getRequestURI()), sanitizeForLog(ex.getMessage()));
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Duplicate Phone Number")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handles DataIntegrityViolationException and returns HTTP 409 Conflict.
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation occurred at {}", sanitizeForLog(request.getRequestURI()));
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message("A database constraint violation or duplicate record occurred")
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handles InvalidCredentialsException and returns HTTP 401 Unauthorized.
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentialsException(InvalidCredentialsException ex, HttpServletRequest request) {
        log.warn("Authentication failed at {}: {}", sanitizeForLog(request.getRequestURI()), sanitizeForLog(ex.getMessage()));
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handles BadRequestException and returns HTTP 400 Bad Request.
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request exception at {}", sanitizeForLog(request.getRequestURI()));
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles HttpMessageNotReadableException for malformed request bodies and returns HTTP 400 Bad Request.
     *
     * @param ex the exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON request: {}", request.getRequestURI());
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Malformed request body")
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles bean validation failures (MethodArgumentNotValidException) and returns HTTP 400 with a map of field errors.
     *
     * @param ex the validation exception
     * @param request the HTTP request
     * @return response entity with validation errors map
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("Validation failed for request {}", sanitizeForLog(request.getRequestURI()));
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            if (error instanceof FieldError fieldError) {
                fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            } else {
                String objectName = error.getObjectName() != null ? error.getObjectName() : "_global";
                fieldErrors.put(objectName, error.getDefaultMessage());
            }
        });

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message("Input validation error")
                .path(request.getRequestURI())
                .errors(fieldErrors)
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles MethodArgumentTypeMismatchException for parameter conversion errors and returns HTTP 400 Bad Request.
     *
     * @param ex the type mismatch exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        log.warn("Parameter type mismatch at {}: parameter '{}'", sanitizeForLog(request.getRequestURI()), sanitizeForLog(ex.getName()));
        String message = String.format("Invalid parameter '%s'", ex.getName());
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles ConstraintViolationException for method and parameter-level validation failures.
     *
     * @param ex the constraint violation exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            jakarta.validation.ConstraintViolationException ex,
            HttpServletRequest request) {
        log.warn("Constraint violation at {}", sanitizeForLog(request.getRequestURI()));
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String propertyPath = violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "_global";
            errors.put(propertyPath, violation.getMessage());
        });

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Constraint validation failed")
                .path(request.getRequestURI())
                .errors(errors)
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles HandlerMethodValidationException for controller method parameter validation.
     *
     * @param ex the method validation exception
     * @param request the HTTP request
     * @return response entity with ErrorResponse payload
     */
    @ExceptionHandler(org.springframework.web.method.annotation.HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleHandlerMethodValidationException(
            org.springframework.web.method.annotation.HandlerMethodValidationException ex,
            HttpServletRequest request) {
        log.warn("Handler method validation failed at {}", sanitizeForLog(request.getRequestURI()));
        Map<String, String> errors = new HashMap<>();
        ex.getAllValidationResults().forEach(result -> {
            String paramName = result.getMethodParameter().getParameterName();
            result.getResolvableErrors().forEach(err -> {
                errors.put(paramName != null ? paramName : "_param", err.getDefaultMessage());
            });
        });

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Parameter validation failed")
                .path(request.getRequestURI())
                .errors(errors)
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Fallback handler for all uncaught generic exceptions returning HTTP 500 Internal Server Error.
     *
     * @param ex the unhandled exception
     * @param request the HTTP request
     * @return response entity with generic internal server error
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception occurred at {}: ", sanitizeForLog(request.getRequestURI()), ex);
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .message("An unexpected error occurred.")
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

