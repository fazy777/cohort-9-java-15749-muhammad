package com.contact_managment.main_application.repository;

import com.contact_managment.main_application.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should save and find user by email or phone")
    void findByEmailOrPhone_Success() {
        User user = User.builder()
                .firstName("Test")
                .lastName("User")
                .email("test@example.com")
                .phone("+999888777")
                .password("secret")
                .build();

        userRepository.save(user);

        Optional<User> foundByEmail = userRepository.findByEmailOrPhone("test@example.com");
        assertTrue(foundByEmail.isPresent());
        assertEquals("Test", foundByEmail.get().getFirstName());

        Optional<User> foundByPhone = userRepository.findByEmailOrPhone("+999888777");
        assertTrue(foundByPhone.isPresent());
        assertEquals("User", foundByPhone.get().getLastName());
    }
}
