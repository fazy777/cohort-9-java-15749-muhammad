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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting registration for email: {} or phone: {}", request.getEmail(), request.getPhone());

        if (!StringUtils.hasText(request.getEmail()) && !StringUtils.hasText(request.getPhone())) {
            throw new BadRequestException("Either Email or Phone number must be provided for registration");
        }

        if (StringUtils.hasText(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email '" + request.getEmail() + "' already exists");
        }

        if (StringUtils.hasText(request.getPhone()) && userRepository.existsByPhone(request.getPhone())) {
            throw new UserAlreadyExistsException("User with phone number '" + request.getPhone() + "' already exists");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(StringUtils.hasText(request.getEmail()) ? request.getEmail() : null)
                .phone(StringUtils.hasText(request.getPhone()) ? request.getPhone() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        String token = tokenProvider.generateTokenFromUserId(savedUser.getId());

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

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt with credential: {}", request.getCredential());

        User user = userRepository.findByEmailOrPhone(request.getCredential())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email/phone or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Invalid password for user credential: {}", request.getCredential());
            throw new InvalidCredentialsException("Invalid email/phone or password");
        }

        String token = tokenProvider.generateTokenFromUserId(user.getId());
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

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        log.info("Change password requested for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            log.warn("Password change failed for user ID {}: Current password incorrect", userId);
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password updated successfully for user ID: {}", userId);
    }
}
