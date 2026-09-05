package com.contact_managment.main_application.exception;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standardized JSON error response payload returned on API errors and validation failures.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
    private Map<String, String> errors;
    private Integer strike;
    private Boolean accountClosed;
    private String duplicateNumber;
}
