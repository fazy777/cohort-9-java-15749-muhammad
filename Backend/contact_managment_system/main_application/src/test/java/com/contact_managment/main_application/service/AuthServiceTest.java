package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.exception.BadRequestException;
import com.contact_managment.main_application.exception.InvalidCredentialsException;
import com.contact_managment.main_application.exception.ResourceNotFoundException;
import com.contact_managment.main_application.exception.UserAlreadyExistsException;
import com.contact_managment.main_application.repository.UserRepository;
import com.contact_managment.main_application.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phone("+1234567890")
                .password("encodedPassword")
                .tokenVersion(1L)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should register user successfully with email")
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.saveAndFlush(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateToken(1L, 1L)).thenReturn("jwt-token-123");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertEquals("John", response.getFirstName());
        verify(userRepository, times(1)).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("Should normalize email and trim phone during registration")
    void register_NormalizesEmailAndPhone() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("  John.Doe@Example.COM  ")
                .phone("  +1234567890  ")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+1234567890")).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.saveAndFlush(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateToken(1L, 1L)).thenReturn("jwt-token-123");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        org.mockito.ArgumentCaptor<User> userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        assertEquals("john.doe@example.com", userCaptor.getValue().getEmail());
        assertEquals("+1234567890", userCaptor.getValue().getPhone());
    }

    @Test
    @DisplayName("Should throw UserAlreadyExistsException when database throws DataIntegrityViolationException")
    void register_DataIntegrityViolation_ThrowsUserAlreadyExists() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.saveAndFlush(any(User.class))).thenThrow(new org.springframework.dao.DataIntegrityViolationException("Duplicate entry"));

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("Should throw exception when registering with neither email nor phone")
    void register_NeitherEmailNorPhone_ThrowsBadRequest() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .password("password123")
                .build();

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void register_EmailAlreadyExists() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when phone number already exists")
    void register_PhoneAlreadyExists() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .phone("+1234567890")
                .password("password123")
                .build();

        when(userRepository.existsByPhone("+1234567890")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when registering email that already exists as a phone number")
    void register_EmailMatchesExistingPhone_ThrowsUserAlreadyExists() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("conflict@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("conflict@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("conflict@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when registering phone that already exists as an email")
    void register_PhoneMatchesExistingEmail_ThrowsUserAlreadyExists() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .phone("+1234567890")
                .password("password123")
                .build();

        when(userRepository.existsByPhone("+1234567890")).thenReturn(false);
        when(userRepository.existsByEmail("+1234567890")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .credential("john.doe@example.com")
                .password("password123")
                .build();

        when(userRepository.findByEmailOrPhone(request.getCredential())).thenReturn(java.util.List.of(sampleUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(tokenProvider.generateToken(1L, 1L)).thenReturn("jwt-token-123");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertEquals("John", response.getFirstName());
    }

    @Test
    @DisplayName("Should login successfully with mixed-case email")
    void login_MixedCaseEmail_Success() {
        LoginRequest request = LoginRequest.builder()
                .credential("  John.Doe@EXAMPLE.COM  ")
                .password("password123")
                .build();

        when(userRepository.findByEmailOrPhone("john.doe@example.com")).thenReturn(java.util.List.of(sampleUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(tokenProvider.generateToken(1L, 1L)).thenReturn("jwt-token-123");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
    }

    @Test
    @DisplayName("Should throw exception on invalid password during login")
    void login_InvalidPassword() {
        LoginRequest request = LoginRequest.builder()
                .credential("john.doe@example.com")
                .password("wrongpassword")
                .build();

        when(userRepository.findByEmailOrPhone(request.getCredential())).thenReturn(java.util.List.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should throw exception on unknown user during login")
    void login_UserNotFound_ThrowsInvalidCredentials() {
        LoginRequest request = LoginRequest.builder()
                .credential("unknown@example.com")
                .password("password123")
                .build();

        when(userRepository.findByEmailOrPhone("unknown@example.com")).thenReturn(java.util.Collections.emptyList());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should throw exception when multiple users match the credential")
    void login_MultipleMatchingUsers_ThrowsInvalidCredentials() {
        User otherUser = User.builder()
                .id(2L)
                .firstName("Jane")
                .lastName("Doe")
                .email("other@example.com")
                .phone("shared-credential")
                .password("otherEncodedPassword")
                .tokenVersion(1L)
                .build();

        LoginRequest request = LoginRequest.builder()
                .credential("shared-credential")
                .password("password123")
                .build();

        when(userRepository.findByEmailOrPhone("shared-credential")).thenReturn(java.util.List.of(otherUser, sampleUser));

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should throw BadRequestException when login password is null")
    void login_NullPassword_ThrowsBadRequestException() {
        LoginRequest request = LoginRequest.builder()
                .credential("john.doe@example.com")
                .password(null)
                .build();

        assertThrows(BadRequestException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should throw BadRequestException when login password exceeds 72 bytes")
    void login_PasswordExceeds72Bytes_ThrowsBadRequestException() {
        LoginRequest request = LoginRequest.builder()
                .credential("john.doe@example.com")
                .password("a".repeat(73))
                .build();

        assertThrows(BadRequestException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should retrieve current user profile successfully")
    void getCurrentUserProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        UserProfileDto profile = authService.getCurrentUserProfile(1L);

        assertNotNull(profile);
        assertEquals(1L, profile.getId());
        assertEquals("john.doe@example.com", profile.getEmail());
        assertEquals("John", profile.getFirstName());
    }

    @Test
    @DisplayName("Should throw exception when getting profile of unknown user")
    void getCurrentUserProfile_UnknownUser_ThrowsNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.getCurrentUserProfile(999L));
    }

    @Test
    @DisplayName("Should change password successfully and increment tokenVersion")
    void changePassword_Success_IncrementsTokenVersion() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPass")
                .newPassword("newPass123")
                .build();

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("newEncodedPassword");

        authService.changePassword(1L, request);

        verify(userRepository, times(1)).save(sampleUser);
        assertEquals("newEncodedPassword", sampleUser.getPassword());
        assertEquals(2L, sampleUser.getTokenVersion());
    }

    @Test
    @DisplayName("Should change password consecutively and increment tokenVersion sequentially")
    void changePassword_ConsecutiveCalls_IncrementsTokenVersionEachTime() {
        ChangePasswordRequest request1 = ChangePasswordRequest.builder()
                .currentPassword("oldPass")
                .newPassword("pass1")
                .build();
        ChangePasswordRequest request2 = ChangePasswordRequest.builder()
                .currentPassword("pass1")
                .newPassword("pass2")
                .build();

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("pass1")).thenReturn("encodedPass1");

        authService.changePassword(1L, request1);
        assertEquals(2L, sampleUser.getTokenVersion());

        when(passwordEncoder.matches("pass1", "encodedPass1")).thenReturn(true);
        when(passwordEncoder.encode("pass2")).thenReturn("encodedPass2");

        authService.changePassword(1L, request2);
        assertEquals(3L, sampleUser.getTokenVersion());
    }

    @Test
    @DisplayName("Should throw exception when current password is incorrect")
    void changePassword_WrongCurrentPassword() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongOldPass")
                .newPassword("newPass123")
                .build();

        when(userRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongOldPass", "encodedPassword")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.changePassword(1L, request));
    }

    @Test
    @DisplayName("Should throw BadRequestException when register receives null request")
    void register_NullRequest_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, () -> authService.register(null));
    }

    @Test
    @DisplayName("Should throw BadRequestException when login receives null request")
    void login_NullRequest_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, () -> authService.login(null));
    }

    @Test
    @DisplayName("Should throw BadRequestException when changePassword receives null request")
    void changePassword_NullRequest_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, () -> authService.changePassword(1L, null));
    }
}

