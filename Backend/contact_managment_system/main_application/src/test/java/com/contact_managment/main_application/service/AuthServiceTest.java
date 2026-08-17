package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.exception.BadRequestException;
import com.contact_managment.main_application.exception.InvalidCredentialsException;
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

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(tokenProvider.generateTokenFromUserId(1L)).thenReturn("jwt-token-123");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertEquals("John", response.getFirstName());
        verify(userRepository, times(1)).save(any(User.class));
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

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .credential("john.doe@example.com")
                .password("password123")
                .build();

        when(userRepository.findByEmailOrPhone(request.getCredential())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(tokenProvider.generateTokenFromUserId(1L)).thenReturn("jwt-token-123");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertEquals("John", response.getFirstName());
    }

    @Test
    @DisplayName("Should throw exception on invalid password during login")
    void login_InvalidPassword() {
        LoginRequest request = LoginRequest.builder()
                .credential("john.doe@example.com")
                .password("wrongpassword")
                .build();

        when(userRepository.findByEmailOrPhone(request.getCredential())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should change password successfully")
    void changePassword_Success() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldPass")
                .newPassword("newPass123")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("newEncodedPassword");

        authService.changePassword(1L, request);

        verify(userRepository, times(1)).save(sampleUser);
        assertEquals("newEncodedPassword", sampleUser.getPassword());
    }

    @Test
    @DisplayName("Should throw exception when current password is incorrect")
    void changePassword_WrongCurrentPassword() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongOldPass")
                .newPassword("newPass123")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongOldPass", "encodedPassword")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.changePassword(1L, request));
    }
}
