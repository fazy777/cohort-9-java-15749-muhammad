package com.contact_managment.main_application.dto;

import lombok.*;

/**
 * Authentication response payload returning the JWT token and logged-in user summary.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
}
