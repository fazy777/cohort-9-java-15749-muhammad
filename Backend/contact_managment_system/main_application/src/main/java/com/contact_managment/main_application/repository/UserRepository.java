package com.contact_managment.main_application.repository;

import com.contact_managment.main_application.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    @Query("SELECT u FROM User u WHERE (u.email IS NOT NULL AND u.email = :credential) OR (u.phone IS NOT NULL AND u.phone = :credential)")
    Optional<User> findByEmailOrPhone(@Param("credential") String credential);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}
