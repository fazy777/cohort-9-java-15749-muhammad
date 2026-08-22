package com.contact_managment.main_application.security;

import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.transaction.annotation.Transactional
class SecurityFilterIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        testUser = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Security")
                .email("alice.security@example.com")
                .password("encodedSecretPassword")
                .tokenVersion(1L)
                .build());
    }

    @Test
    @DisplayName("Should return 401 Unauthorized for protected endpoint when no token is provided")
    void protectedEndpoint_NoToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/auth/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Should return 200 OK for protected endpoint when valid token with matching version is provided")
    void protectedEndpoint_ValidToken_Returns200() throws Exception {
        String token = jwtTokenProvider.generateToken(testUser.getId(), 1L);

        mockMvc.perform(get("/api/auth/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("alice.security@example.com"));
    }

    @Test
    @DisplayName("Should return 401 Unauthorized when token version does not match user current version (revoked token)")
    void protectedEndpoint_TokenVersionMismatch_Returns401() throws Exception {
        // Token has tokenVersion = 1L
        String staleToken = jwtTokenProvider.generateToken(testUser.getId(), 1L);

        // Update user token version in database to 2L (simulating password change)
        testUser.setTokenVersion(2L);
        userRepository.save(testUser);

        mockMvc.perform(get("/api/auth/profile")
                        .header("Authorization", "Bearer " + staleToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }
}
