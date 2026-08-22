package com.contact_managment.main_application.repository;

import com.contact_managment.main_application.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
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

        List<User> foundByEmail = userRepository.findByEmailOrPhone("test@example.com");
        assertFalse(foundByEmail.isEmpty());
        assertEquals("Test", foundByEmail.get(0).getFirstName());

        List<User> foundByPhone = userRepository.findByEmailOrPhone("+999888777");
        assertFalse(foundByPhone.isEmpty());
        assertEquals("User", foundByPhone.get(0).getLastName());
    }

    @Test
    @DisplayName("Should find multiple users if phone of user1 matches email of user2 without throwing exception")
    void findByEmailOrPhone_MultipleMatches() {
        User user1 = User.builder()
                .firstName("UserOne")
                .lastName("First")
                .email("user1@example.com")
                .phone("shared-credential")
                .password("secret1")
                .build();

        User user2 = User.builder()
                .firstName("UserTwo")
                .lastName("Second")
                .email("shared-credential")
                .phone("+111222333")
                .password("secret2")
                .build();

        userRepository.save(user1);
        userRepository.save(user2);

        List<User> found = userRepository.findByEmailOrPhone("shared-credential");
        assertEquals(2, found.size());
    }
}
