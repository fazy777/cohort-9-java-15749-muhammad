package com.contact_managment.main_application.dto;

import lombok.*;

/**
 * Internal result wrapper holding user response data and generated JWT token for cookie attachment.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResult {

    private AuthResponse authResponse;
    private String token;
}
