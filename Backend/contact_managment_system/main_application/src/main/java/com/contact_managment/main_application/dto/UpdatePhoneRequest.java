package com.contact_managment.main_application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for adding or updating an authenticated user's phone number.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePhoneRequest {

    @NotBlank(message = "Phone number is required")
    @Size(min = 7, max = 30, message = "Phone number must be between 7 and 30 characters")
    @Pattern(regexp = "^[+0-9\\s\\-\\(\\)\\.]{7,30}$", message = "Phone number contains invalid characters")
    private String phone;
}
