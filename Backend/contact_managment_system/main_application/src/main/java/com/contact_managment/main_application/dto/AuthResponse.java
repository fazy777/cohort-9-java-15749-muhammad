package com.contact_managment.main_application.dto;

import lombok.*;

/**
 * Authentication response payload returning logged-in user summary.
 * Note: Authentication JWT tokens are transmitted via secure HttpOnly cookies rather than JSON body.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
}
