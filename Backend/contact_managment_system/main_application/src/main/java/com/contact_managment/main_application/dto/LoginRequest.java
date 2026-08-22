package com.contact_managment.main_application.dto;

import com.contact_managment.main_application.validation.MaxByteLength;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Request payload for authenticating user credentials (email or phone, and password).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Email or phone number is required")
    private String credential;

    @NotBlank(message = "Password is required")
    @MaxByteLength(max = 72, message = "Password cannot exceed 72 bytes")
    private String password;
}
