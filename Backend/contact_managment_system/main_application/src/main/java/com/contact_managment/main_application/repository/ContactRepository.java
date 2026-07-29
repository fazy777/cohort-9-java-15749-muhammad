package com.contact_managment.main_application.repository;

import com.contact_managment.main_application.entity.Contact;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for Contact entity with type-safe generics.
 * No raw types used - fully parameterized.
 */
@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    /**
     * Find contacts by user ID with pagination.
     *
     * @param userId   user identifier, must not be null
     * @param pageable pagination information, must not be null
     * @return page of contacts, never null
     */
    Page<Contact> findByUserId(Long userId, Pageable pageable);

    /**
     * Search contacts by first name or last name containing keyword (case-insensitive).
     *
     * @param firstName keyword for first name, must not be null
     * @param lastName  keyword for last name, must not be null
     * @param pageable  pagination information
     * @return page of matching contacts
     */
    Page<Contact> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName, Pageable pageable);

    /**
     * Find by user ID and ID.
     *
     * @param userId user identifier
     * @param id     contact identifier
     * @return optional contact
     */
    Optional<Contact> findByUserIdAndId(Long userId, Long id);

    /**
     * Find all contacts for a user ordered by last name.
     *
     * @param userId user identifier
     * @return list of contacts, never null
     */
    List<Contact> findByUserIdOrderByLastNameAsc(Long userId);
}
