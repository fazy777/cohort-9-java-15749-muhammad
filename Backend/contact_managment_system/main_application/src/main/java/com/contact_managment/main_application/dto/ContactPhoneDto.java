package com.contact_managment.main_application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactPhoneDto {

    private Long id;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Phone label is required")
    private String label; // e.g. WORK, HOME, PERSONAL, MOBILE, OTHER
}
