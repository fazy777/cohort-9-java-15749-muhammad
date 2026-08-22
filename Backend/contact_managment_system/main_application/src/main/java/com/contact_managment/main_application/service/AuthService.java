package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.exception.BadRequestException;
import com.contact_managment.main_application.exception.InvalidCredentialsException;
import com.contact_managment.main_application.exception.ResourceNotFoundException;
import com.contact_managment.main_application.exception.UserAlreadyExistsException;
import com.contact_managment.main_application.repository.UserRepository;
import com.contact_managment.main_application.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

/**
 * Service managing user authentication, account creation, token generation, profile retrieval, and password rotation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String DUMMY_PASSWORD_HASH = "$2a$10$wT8f6sQ4dJg0K8V5W6jJCe9sM/tJ4/m9yvE.e/L3Hw4H4u2x7C7nS";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * Registers a new user with normalized email/phone and encoded password.
     *
     * @param request the registration details
     * @return the authentication response containing a JWT token and user info
     * @throws BadRequestException if neither email nor phone is provided
     * @throws UserAlreadyExistsException if email or phone is already registered
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.debug("Registration attempt received");
        if (request == null) {
            throw new BadRequestException("Registration request payload cannot be null");
        }

        validatePassword(request.getPassword(), "Password");

        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : null;
        String phone = StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null;

        if (!StringUtils.hasText(email) && !StringUtils.hasText(phone)) {
            throw new BadRequestException("Either Email or Phone number must be provided for registration");
        }

        if (StringUtils.hasText(email) && userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("User with this email already exists");
        }

        if (StringUtils.hasText(phone) && userRepository.existsByPhone(phone)) {
            throw new UserAlreadyExistsException("User with this phone number already exists");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(request.getPassword()))
                .tokenVersion(1L)
                .build();

        User savedUser;
        try {
            savedUser = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Database conflict during registration: {}", ex.getMessage());
            throw new UserAlreadyExistsException("User with provided email or phone already exists");
        }

        log.info("User registered successfully with ID: {}", savedUser.getId());

        String token = tokenProvider.generateToken(savedUser.getId(), savedUser.getTokenVersion());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(savedUser.getId())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .build();
    }

    /**
     * Authenticates user credentials and issues a JWT token.
     *
     * @param request login credentials (email or phone, and password)
     * @return authentication response containing token and user profile
     * @throws InvalidCredentialsException if credentials are invalid
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        log.debug("Login attempt received");
        if (request == null) {
            throw new BadRequestException("Login request payload cannot be null");
        }

        String rawCredential = request.getCredential() != null ? request.getCredential().trim() : "";
        String credential = rawCredential.toLowerCase(java.util.Locale.ROOT);
        java.util.List<User> users = userRepository.findByEmailOrPhone(credential);
        if (users.isEmpty() && !rawCredential.equalsIgnoreCase(credential)) {
            users = userRepository.findByEmailOrPhone(rawCredential);
        }

        if (users.isEmpty()) {
            passwordEncoder.matches(request.getPassword(), DUMMY_PASSWORD_HASH);
            log.warn("Login failed: User not found");
            throw new InvalidCredentialsException("Invalid email/phone or password");
        }

        if (users.size() > 1) {
            log.warn("Login failed: Multiple users matched credential");
            throw new InvalidCredentialsException("Invalid email/phone or password");
        }

        User user = users.get(0);
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed: Invalid password for user ID: {}", user.getId());
            throw new InvalidCredentialsException("Invalid email/phone or password");
        }

        Long version = user.getTokenVersion() != null ? user.getTokenVersion() : 1L;
        String token = tokenProvider.generateToken(user.getId(), version);
        log.info("User logged in successfully with ID: {}", user.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }

    /**
     * Retrieves the profile information for a specific user ID.
     *
     * @param userId the unique user identifier
     * @return user profile data transfer object
     * @throws ResourceNotFoundException if user is not found
     */
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(Long userId) {
        log.debug("Fetching profile for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        return UserProfileDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Changes a user's password, encrypts the new password, and increments token version to invalidate existing sessions.
     *
     * @param userId the user ID
     * @param request current and new password payload
     * @throws ResourceNotFoundException if user is not found
     * @throws BadRequestException if the current password does not match
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        log.info("Change password requested for user ID: {}", userId);
        if (request == null) {
            throw new BadRequestException("Change password request payload cannot be null");
        }

        validatePassword(request.getCurrentPassword(), "Current password");
        validatePassword(request.getNewPassword(), "New password");

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            log.warn("Password change failed for user ID {}: Current password incorrect", userId);
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Invalidate previous tokens by incrementing token version
        user.setTokenVersion((user.getTokenVersion() != null ? user.getTokenVersion() : 1L) + 1L);
        userRepository.save(user);
        log.info("Password updated and existing tokens invalidated successfully for user ID: {}", userId);
    }

    /**
     * Validates that a password is non-null and does not exceed 72 UTF-8 bytes.
     *
     * @param password the password to validate
     * @param fieldName the field name for error reporting
     * @throws BadRequestException if the password is null or exceeds 72 UTF-8 bytes
     */
    private void validatePassword(String password, String fieldName) {
        if (password == null) {
            throw new BadRequestException(fieldName + " cannot be null");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadRequestException(fieldName + " cannot exceed 72 bytes");
        }
    }
}

