package com.contact_managment.main_application.dto;

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
    private String password;
}
