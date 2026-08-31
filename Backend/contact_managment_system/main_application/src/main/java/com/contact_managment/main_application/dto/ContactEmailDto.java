package com.contact_managment.main_application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Data transfer object for contact email address and category label.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactEmailDto {

    private Long id;

    @NotBlank(message = "Email address is required")
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotBlank(message = "Email label is required")
    @Size(max = 50, message = "Email label cannot exceed 50 characters")
    private String label; // e.g. WORK, PERSONAL, OTHER
}
