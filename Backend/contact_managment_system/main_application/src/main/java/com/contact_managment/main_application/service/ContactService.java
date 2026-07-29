package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.ContactDto;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service contract for Contact management following Dependency Inversion Principle.
 * Uses dependency injection and defines explicit null safety contracts.
 */
public interface ContactService {

    /**
     * Creates a new contact for a user.
     *
     * @param userId     owner user ID, must not be null
     * @param contactDto contact data, must not be null and must be valid
     * @return created contact DTO, never null
     * @throws IllegalArgumentException if any parameter is null or invalid
     */
    ContactDto createContact(Long userId, ContactDto contactDto);

    /**
     * Retrieves a contact by ID.
     *
     * @param userId    owner user ID, must not be null
     * @param contactId contact ID, must not be null
     * @return contact DTO, never null
     */
    ContactDto getContactById(Long userId, Long contactId);

    /**
     * Retrieves all contacts for a user with pagination.
     *
     * @param userId   user ID, must not be null
     * @param pageable pagination info, must not be null
     * @return page of contacts
     */
    Page<ContactDto> getAllContacts(Long userId, Pageable pageable);

    /**
     * Retrieves all contacts for a user without pagination.
     *
     * @param userId user ID
     * @return list of contacts
     */
    List<ContactDto> getAllContactsByUserId(Long userId);

    /**
     * Updates an existing contact.
     *
     * @param userId     user ID, must not be null
     * @param contactId  contact ID to update, must not be null
     * @param contactDto updated data, must not be null
     * @return updated contact DTO
     */
    ContactDto updateContact(Long userId, Long contactId, ContactDto contactDto);

    /**
     * Deletes a contact.
     *
     * @param userId    user ID, must not be null
     * @param contactId contact ID, must not be null
     */
    void deleteContact(Long userId, Long contactId);

    /**
     * Searches contacts by keyword.
     *
     * @param userId   user ID
     * @param keyword  search keyword, must not be null
     * @param pageable pagination
     * @return page of matching contacts
     */
    Page<ContactDto> searchContacts(Long userId, String keyword, Pageable pageable);
}
