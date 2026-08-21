package com.contact_managment.main_application.dto;

import com.contact_managment.main_application.validation.MaxByteLength;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request payload for creating a new user account with personal info, credentials, and validation rules.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name cannot exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name cannot exceed 100 characters")
    private String lastName;

    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @Pattern(regexp = "^$|^(?=.*[0-9])[+0-9\\s()\\-\\.]+$", message = "Invalid phone number format")
    @Size(max = 30, message = "Phone number cannot exceed 30 characters")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    @MaxByteLength(max = 72, message = "Password cannot exceed 72 bytes")
    private String password;
}
