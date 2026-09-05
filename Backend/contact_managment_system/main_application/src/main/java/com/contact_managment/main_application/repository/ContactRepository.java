package com.contact_managment.main_application.repository;

import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Contact entities with custom search queries and user-scoped operations.
 */
@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    /**
     * Finds paginated contacts owned by a user.
     *
     * @param user the owning user
     * @param pageable pagination parameters
     * @return page of contacts
     */
    Page<Contact> findByUser(User user, Pageable pageable);

    /**
     * Performs case-insensitive text search across first name, last name, title, emails, and phone numbers for a user.
     *
     * @param user the owning user
     * @param query search query substring
     * @param pageable pagination parameters
     * @return page of matched contacts
     */
    @Query(value = "SELECT DISTINCT c FROM Contact c " +
           "LEFT JOIN c.emails e " +
           "LEFT JOIN c.phones p " +
           "WHERE c.user = :user AND (" +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.phoneNumber LIKE CONCAT('%', :query, '%'))",
           countQuery = "SELECT COUNT(DISTINCT c) FROM Contact c " +
           "LEFT JOIN c.emails e " +
           "LEFT JOIN c.phones p " +
           "WHERE c.user = :user AND (" +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.phoneNumber LIKE CONCAT('%', :query, '%'))")
    Page<Contact> searchByUserAndQuery(@Param("user") User user, @Param("query") String query, Pageable pageable);

    /**
     * Finds a contact by its ID and owning user.
     *
     * @param id contact ID
     * @param user owning user
     * @return Optional containing the contact if found
     */
    Optional<Contact> findByIdAndUser(Long id, User user);

    /**
     * Finds all contacts belonging to a user (used for export).
     *
     * @param user owning user
     * @return list of contacts
     */
    List<Contact> findByUser(User user);

    /**
     * Streams contacts belonging to a user for memory-efficient exports within a read-only transaction.
     *
     * @param user owning user
     * @return stream of contacts
     */
    java.util.stream.Stream<Contact> streamByUser(User user);

    /**
     * Retrieves all phone numbers for contacts belonging to a user.
     * Used for duplicate phone number detection during contact creation.
     *
     * @param user owning user
     * @return list of existing phone number strings
     */
    @Query("SELECT p.phoneNumber FROM ContactPhone p WHERE p.contact.user = :user")
    List<String> findPhoneNumbersByUser(@Param("user") User user);

    /**
     * Retrieves all phone numbers for contacts belonging to a user, excluding a specific contact ID.
     * Used for duplicate phone number detection during contact updates.
     *
     * @param user owning user
     * @param excludeContactId contact ID to exclude
     * @return list of existing phone number strings
     */
    @Query("SELECT p.phoneNumber FROM ContactPhone p WHERE p.contact.user = :user AND p.contact.id != :excludeContactId")
    List<String> findPhoneNumbersByUserAndContactIdNot(@Param("user") User user, @Param("excludeContactId") Long excludeContactId);

    /**
     * Convenience method that delegates to the appropriate query method based on whether excludeContactId is present.
     *
     * @param user owning user
     * @param excludeContactId contact ID to exclude (null for new contacts)
     * @return list of existing phone number strings
     */
    default List<String> findPhoneNumbersByUserExcludingContact(User user, Long excludeContactId) {
        if (excludeContactId == null) {
            return findPhoneNumbersByUser(user);
        }
        return findPhoneNumbersByUserAndContactIdNot(user, excludeContactId);
    }
}
