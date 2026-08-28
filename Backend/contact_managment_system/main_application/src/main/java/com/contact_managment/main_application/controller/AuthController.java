package com.contact_managment.main_application.controller;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.exception.InvalidCredentialsException;
import com.contact_managment.main_application.security.UserPrincipal;
import com.contact_managment.main_application.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user authentication, registration, profile retrieval, logout, and credential management.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.cookie.name:cms_auth_token}")
    private String cookieName;

    @Value("${jwt.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${jwt.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationInMs;

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
     * Attaches an HttpOnly, Secure, SameSite JWT authentication cookie to the HTTP response.
     *
     * @param response the servlet response
     * @param token the JWT string
     * @param maxAgeSeconds maximum cookie lifespan in seconds
     */
    private void attachAuthCookie(HttpServletResponse response, String token, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Clears the HttpOnly JWT authentication cookie on the HTTP response.
     *
     * @param response the servlet response
     */
    private void clearAuthCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Registers a new user account, attaches an HttpOnly JWT cookie, and returns user summary.
     *
     * @param request the registration request containing user details and credentials
     * @param response the HTTP response for cookie attachment
     * @return response entity containing API response with user data
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthResult authResult = authService.register(request);
        attachAuthCookie(response, authResult.getToken(), jwtExpirationInMs / 1000);
        return new ResponseEntity<>(ApiResponse.success("User registered successfully", authResult.getAuthResponse()), HttpStatus.CREATED);
    }

    /**
     * Authenticates an existing user, attaches an HttpOnly JWT cookie, and returns user summary.
     *
     * @param request the login request containing email or phone and password
     * @param response the HTTP response for cookie attachment
     * @return response entity containing API response with user data
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResult authResult = authService.login(request);
        attachAuthCookie(response, authResult.getToken(), jwtExpirationInMs / 1000);
        return ResponseEntity.ok(ApiResponse.success("User logged in successfully", authResult.getAuthResponse()));
    }

    /**
     * Logs out the user by clearing the HttpOnly JWT cookie and Spring Security context.
     *
     * @param response the HTTP response
     * @return response entity indicating successful logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        clearAuthCookie(response);
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
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
     * Changes the password for the currently authenticated user, invalidates existing tokens, and clears current session cookie.
     *
     * @param userPrincipal the authenticated user principal
     * @param request the change password request with current and new passwords
     * @param response the HTTP response
     * @return response entity indicating success
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletResponse response) {
        authService.changePassword(requireUserId(userPrincipal), request);
        clearAuthCookie(response);
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    /**
     * Endpoint to initialize or refresh the CSRF token cookie for single-page applications.
     *
     * @return response entity with success status
     */
    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<Void>> csrf() {
        return ResponseEntity.ok(ApiResponse.success("CSRF token initialized"));
    }
}
