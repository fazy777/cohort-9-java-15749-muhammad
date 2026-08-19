package com.contact_managment.main_application.repository;

import com.contact_managment.main_application.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for User entities supporting lookups by email, phone, and unified credential matching.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by unique email address.
     *
     * @param email normalized email address
     * @return Optional containing the User if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds a user by unique phone number.
     *
     * @param phone trimmed phone number
     * @return Optional containing the User if found
     */
    Optional<User> findByPhone(String phone);

    /**
     * Finds a user by either email or phone number matching the provided credential.
     *
     * @param credential email or phone number
     * @return Optional containing the User if found
     */
    @Query("SELECT u FROM User u WHERE (u.email IS NOT NULL AND u.email = :credential) OR (u.phone IS NOT NULL AND u.phone = :credential)")
    Optional<User> findByEmailOrPhone(@Param("credential") String credential);

    /**
     * Checks if a user exists with the given email address.
     *
     * @param email email address to check
     * @return true if a matching user exists
     */
    boolean existsByEmail(String email);

    /**
     * Checks if a user exists with the given phone number.
     *
     * @param phone phone number to check
     * @return true if a matching user exists
     */
    boolean existsByPhone(String phone);
}
