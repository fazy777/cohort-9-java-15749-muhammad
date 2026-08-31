package com.contact_managment.main_application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Data transfer object for contact phone number and category label.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactPhoneDto {

    private Long id;

    @NotBlank(message = "Phone number is required")
    @Size(max = 30, message = "Phone number cannot exceed 30 characters")
    private String phoneNumber;

    @NotBlank(message = "Phone label is required")
    @Size(max = 50, message = "Phone label cannot exceed 50 characters")
    private String label; // e.g. WORK, HOME, PERSONAL, MOBILE, OTHER
}
