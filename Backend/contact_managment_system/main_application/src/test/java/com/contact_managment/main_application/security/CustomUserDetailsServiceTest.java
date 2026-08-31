package com.contact_managment.main_application.security;

import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phone("+1234567890")
                .password("encodedPassword")
                .tokenVersion(1L)
                .build();
    }

    @Test
    @DisplayName("Should load user by credential successfully when exactly one match exists")
    void loadUserByUsername_SingleMatch_Success() {
        when(userRepository.findByEmailOrPhone("john.doe@example.com")).thenReturn(List.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("john.doe@example.com");

        assertNotNull(userDetails);
        assertEquals("john.doe@example.com", userDetails.getUsername());
        assertTrue(userDetails instanceof UserPrincipal);
        assertEquals(1L, ((UserPrincipal) userDetails).getId());
    }

    @Test
    @DisplayName("Should load user by credential with raw fallback when normalized returns empty")
    void loadUserByUsername_RawFallback_Success() {
        when(userRepository.findByEmailOrPhone("+1234567890")).thenReturn(List.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("+1234567890");

        assertNotNull(userDetails);
        assertEquals("+1234567890", ((UserPrincipal) userDetails).getPhone());
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when no user matches credential")
    void loadUserByUsername_NoMatch_ThrowsException() {
        when(userRepository.findByEmailOrPhone("unknown@example.com")).thenReturn(Collections.emptyList());

        assertThrows(UsernameNotFoundException.class, () ->
                userDetailsService.loadUserByUsername("unknown@example.com")
        );
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when multiple users match ambiguous credential")
    void loadUserByUsername_MultipleMatches_ThrowsException() {
        User user2 = User.builder()
                .id(2L)
                .firstName("Jane")
                .lastName("Smith")
                .email("other@example.com")
                .phone("shared-val")
                .build();

        when(userRepository.findByEmailOrPhone("shared-val")).thenReturn(List.of(testUser, user2));

        assertThrows(UsernameNotFoundException.class, () ->
                userDetailsService.loadUserByUsername("shared-val")
        );
    }

    @Test
    @DisplayName("Should load user by numeric ID successfully")
    void loadUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserDetails userDetails = userDetailsService.loadUserById(1L);

        assertNotNull(userDetails);
        assertEquals(1L, ((UserPrincipal) userDetails).getId());
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user not found by ID")
    void loadUserById_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userDetailsService.loadUserById(99L)
        );
    }
}
