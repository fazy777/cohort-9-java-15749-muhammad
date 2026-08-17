package com.contact_managment.main_application.dto;

import lombok.*;

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
