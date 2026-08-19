package com.contact_managment.main_application.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Data transfer object representing the authenticated user's profile information.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDateTime createdAt;
}
