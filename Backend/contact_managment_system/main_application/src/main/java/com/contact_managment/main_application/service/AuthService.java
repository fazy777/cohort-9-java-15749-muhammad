package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.exception.BadRequestException;
import com.contact_managment.main_application.exception.DuplicatePhoneNumberException;
import com.contact_managment.main_application.exception.InvalidCredentialsException;
import com.contact_managment.main_application.exception.ResourceNotFoundException;
import com.contact_managment.main_application.exception.UserAlreadyExistsException;
import com.contact_managment.main_application.repository.ContactRepository;
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
import java.util.List;

/**
 * Service managing user authentication, account creation, token generation, profile retrieval, and password rotation.
 */
@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final ContactRepository contactRepository;
    private final String dummyPasswordHash;

    @org.springframework.beans.factory.annotation.Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider, ContactRepository contactRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.contactRepository = contactRepository;
        this.dummyPasswordHash = passwordEncoder.encode("dummy-verification-secret");
    }

    /**
     * Registers a new user with normalized email/phone and encoded password.
     *
     * @param request the registration details
     * @return the authentication result containing user info and generated JWT token for cookie attachment
     * @throws BadRequestException if neither email nor phone is provided
     * @throws UserAlreadyExistsException if email or phone is already registered
     */
    @Transactional
    public AuthResult register(RegisterRequest request) {
        log.debug("Registration attempt received");
        if (request == null) {
            throw new BadRequestException("Registration request payload cannot be null");
        }

        validatePassword(request.getPassword(), "Password");

        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : null;
        String phone = null;
        if (StringUtils.hasText(request.getPhone())) {
            phone = validateAndNormalizePhone(request.getPhone());
        }

        if (!StringUtils.hasText(email) && !StringUtils.hasText(phone)) {
            throw new BadRequestException("Either Email or Phone number must be provided for registration");
        }

        if (StringUtils.hasText(email) && (userRepository.existsByEmail(email) || userRepository.existsByPhone(email))) {
            throw new UserAlreadyExistsException("User with this email already exists");
        }

        if (StringUtils.hasText(phone) && (userRepository.existsByPhone(phone) || userRepository.existsByEmail(phone))) {
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

        AuthResponse authResponse = AuthResponse.builder()
                .id(savedUser.getId())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .token(token)
                .build();

        return AuthResult.builder()
                .authResponse(authResponse)
                .token(token)
                .build();
    }

    /**
     * Authenticates user credentials and issues a JWT token.
     *
     * @param request login credentials (email or phone, and password)
     * @return authentication result containing user profile and generated JWT token for cookie attachment
     * @throws InvalidCredentialsException if credentials are invalid
     */
    @Transactional(readOnly = true)
    public AuthResult login(LoginRequest request) {
        log.debug("Login attempt received");
        if (request == null) {
            throw new BadRequestException("Login request payload cannot be null");
        }

        validatePassword(request.getPassword(), "Password");

        String rawCredential = request.getCredential() != null ? request.getCredential().trim() : "";
        String credential = rawCredential.toLowerCase(java.util.Locale.ROOT);
        java.util.List<User> users = userRepository.findByEmailOrPhone(credential);
        if (users.isEmpty() && !rawCredential.equalsIgnoreCase(credential)) {
            users = userRepository.findByEmailOrPhone(rawCredential);
        }

        if (users.isEmpty()) {
            passwordEncoder.matches(request.getPassword(), this.dummyPasswordHash);
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

        AuthResponse authResponse = AuthResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .token(token)
                .build();

        return AuthResult.builder()
                .authResponse(authResponse)
                .token(token)
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
     * Adds or updates the phone number for an authenticated user.
     *
     * @param userId the user ID
     * @param request the update phone payload
     * @return updated user profile DTO
     * @throws BadRequestException if payload is invalid
     * @throws UserAlreadyExistsException if phone number is already registered to another account
     * @throws ResourceNotFoundException if user is not found
     */
    @Transactional(noRollbackFor = DuplicatePhoneNumberException.class)
    public UserProfileDto updatePhone(Long userId, UpdatePhoneRequest request) {
        log.info("Updating phone number for user ID: {}", userId);
        if (request == null || !StringUtils.hasText(request.getPhone())) {
            throw new BadRequestException("Phone number cannot be empty");
        }

        String phone = request.getPhone().trim();
        String canonicalPhone = validateAndNormalizePhone(phone);

        userRepository.findByPhone(canonicalPhone).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new UserAlreadyExistsException("Phone number is already associated with another account");
            }
        });

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        List<String> contactPhones = contactRepository.findPhoneNumbersByUserExcludingContact(user, null);
        if (contactPhones != null && !contactPhones.isEmpty()) {
            boolean conflict = contactPhones.stream()
                    .filter(StringUtils::hasText)
                    .map(this::normalizePhoneNumber)
                    .anyMatch(p -> p.equals(canonicalPhone));
            if (conflict) {
                handleDuplicateStrikeAndThrow(user, phone);
            }
        }

        user.setPhone(canonicalPhone);
        if (user.getDuplicateStrikeCount() > 0) {
            user.setDuplicateStrikeCount(0);
        }
        User saved;
        try {
            saved = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Database conflict updating phone for user ID {}: {}", userId, ex.getMessage());
            throw new UserAlreadyExistsException("Phone number is already associated with another account");
        }
        log.info("Phone number successfully updated for user ID: {}", userId);

        return UserProfileDto.builder()
                .id(saved.getId())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    /**
     * Permanently closes and deletes a user account and all associated contacts.
     *
     * @param userId the user ID to close
     * @throws ResourceNotFoundException if user is not found
     */
    @Transactional
    public void deleteAccount(Long userId) {
        log.warn("Permanent account closure initiated for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        List<Contact> contacts = contactRepository.findByUser(user);
        if (!contacts.isEmpty()) {
            contactRepository.deleteAll(contacts);
            contactRepository.flush();
            log.info("Deleted {} contacts for user ID: {}", contacts.size(), userId);
        }

        userRepository.delete(user);
        userRepository.flush();
        log.info("User account ID: {} permanently closed and purged.", userId);
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

    /**
     * Atomically increments the user's duplicate strike count, persists the change,
     * and either throws a strike-1 warning or terminates the user account on strike 2.
     *
     * @param user owning user
     * @param rawPhone duplicate phone number
     */
    private void handleDuplicateStrikeAndThrow(User user, String rawPhone) {
        if (user == null) {
            throw new DuplicatePhoneNumberException("Duplicate phone number detected: " + rawPhone);
        }

        int currentStrikes = user.getDuplicateStrikeCount();
        int nextStrike = currentStrikes + 1;
        user.setDuplicateStrikeCount(nextStrike);

        if (nextStrike >= 2) {
            List<Contact> contacts = contactRepository.findByUser(user);
            if (contacts != null && !contacts.isEmpty()) {
                contactRepository.deleteAll(contacts);
                contactRepository.flush();
            }
            userRepository.delete(user);
            userRepository.flush();
            log.warn("User ID: {} permanently closed and deleted due to repeat duplicate phone violation", user.getId());
            throw new DuplicatePhoneNumberException(
                    "Account Terminated: Repeated duplicate phone number violation (\"" + rawPhone + "\").",
                    2,
                    true,
                    rawPhone
            );
        } else {
            userRepository.saveAndFlush(user);
            log.warn("User ID: {} received duplicate phone strike {}", user.getId(), nextStrike);
            throw new DuplicatePhoneNumberException(
                    "Warning (1/2): Duplicate phone number \"" + rawPhone + "\" is strictly prohibited.",
                    1,
                    false,
                    rawPhone
            );
        }
    }

    private String validateAndNormalizePhone(String rawInput) {
        String trimmed = rawInput.trim();
        if (trimmed.length() < 7) {
            throw new BadRequestException("Phone number must be at least 7 characters");
        }
        if (trimmed.length() > 30) {
            throw new BadRequestException("Phone number cannot exceed 30 characters");
        }
        String canonical = normalizePhoneNumber(trimmed);
        if (canonical.length() < 7) {
            throw new BadRequestException("Phone number must be at least 7 characters");
        }
        if (canonical.length() > 30) {
            throw new BadRequestException("Phone number cannot exceed 30 characters");
        }
        return canonical;
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[\\s\\-\\(\\)\\.]", "").toLowerCase(java.util.Locale.ROOT);
    }
}

