package com.contact_managment.main_application.controller;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.exception.InvalidCredentialsException;
import com.contact_managment.main_application.security.UserPrincipal;
import com.contact_managment.main_application.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user authentication, registration, profile retrieval, and credential management.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Extracts and validates the user ID from the authenticated user principal.
     *
     * @param userPrincipal the authenticated user principal
     * @return the unique user identifier
     * @throws InvalidCredentialsException if the principal is null or unauthenticated
     */
    private Long requireUserId(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new InvalidCredentialsException("User authentication required");
        }
        return userPrincipal.getId();
    }

    /**
     * Registers a new user account.
     *
     * @param request the registration request containing user details and credentials
     * @return response entity containing API response with authentication token and user data
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(ApiResponse.success("User registered successfully", response), HttpStatus.CREATED);
    }

    /**
     * Authenticates an existing user and returns a JWT token.
     *
     * @param request the login request containing email or phone and password
     * @return response entity containing API response with authentication token and user data
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("User logged in successfully", response));
    }

    /**
     * Retrieves the profile of the currently authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @return response entity containing user profile details
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileDto profile = authService.getCurrentUserProfile(requireUserId(userPrincipal));
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    /**
     * Changes the password for the currently authenticated user and invalidates existing tokens.
     *
     * @param userPrincipal the authenticated user principal
     * @param request the change password request with current and new passwords
     * @return response entity indicating success
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(requireUserId(userPrincipal), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
