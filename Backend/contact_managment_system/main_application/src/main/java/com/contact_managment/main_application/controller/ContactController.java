package com.contact_managment.main_application.controller;

import com.contact_managment.main_application.dto.ApiResponse;
import com.contact_managment.main_application.dto.ContactDto;
import com.contact_managment.main_application.service.ContactService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing contacts with proper exception handling, null checks, and DI.
 */
@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);
    private static final String USER_ID_HEADER = "X-User-Id";

    private final ContactService contactService;

    /**
     * Constructor injection for ContactService (Dependency Injection best practice).
     *
     * @param contactService service implementation, must not be null
     */
    public ContactController(ContactService contactService) {
        this.contactService = Objects.requireNonNull(contactService, "contactService must not be null");
    }

    /**
     * Creates a new contact.
     *
     * @param userId     user ID from header, must not be null
     * @param contactDto contact data
     * @return created contact
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ContactDto>> createContact(
            @RequestParam(defaultValue = "1") Long userId,
            @Valid @RequestBody ContactDto contactDto) {

        Objects.requireNonNull(contactDto, "contactDto must not be null");
        validateUserId(userId);

        try {
            logger.info("Request to create contact for user {}", userId);
            ContactDto created = contactService.createContact(userId, contactDto);
            ApiResponse<ContactDto> response = ApiResponse.success("Contact created successfully", created);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request to create contact: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Failed to create contact for user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gets contact by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> getContactById(
            @RequestParam(defaultValue = "1") Long userId,
            @PathVariable Long id) {

        validateUserId(userId);
        Objects.requireNonNull(id, "id must not be null");

        try {
            ContactDto contact = contactService.getContactById(userId, id);
            ApiResponse<ContactDto> response = ApiResponse.success("Contact retrieved", contact);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get contact {} for user {}: {}", id, userId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gets all contacts with pagination.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ContactDto>>> getAllContacts(
            @RequestParam(defaultValue = "1") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "lastName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {

        validateUserId(userId);
        if (sortBy == null || sortBy.trim().isEmpty()) {
            throw new IllegalArgumentException("sortBy must not be null or blank");
        }

        try {
            // Null safety for sort direction
            Sort.Direction direction = sortDir != null && sortDir.equalsIgnoreCase("desc")
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(direction, sortBy));

            Page<ContactDto> contacts;
            if (search != null && !search.trim().isEmpty()) {
                contacts = contactService.searchContacts(userId, search.trim(), pageable);
            } else {
                contacts = contactService.getAllContacts(userId, pageable);
            }

            ApiResponse<Page<ContactDto>> response = ApiResponse.success("Contacts retrieved", contacts);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to list contacts for user {}: {}", userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to retrieve contacts", e);
        }
    }

    /**
     * Gets all contacts as list (non-paginated).
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ContactDto>>> getAllContactsList(
            @RequestParam(defaultValue = "1") Long userId) {
        validateUserId(userId);
        try {
            List<ContactDto> contacts = contactService.getAllContactsByUserId(userId);
            ApiResponse<List<ContactDto>> response = ApiResponse.success("Contacts retrieved", contacts);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to list all contacts for user {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Updates a contact.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> updateContact(
            @RequestParam(defaultValue = "1") Long userId,
            @PathVariable Long id,
            @Valid @RequestBody ContactDto contactDto) {

        validateUserId(userId);
        Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(contactDto, "contactDto must not be null");

        try {
            ContactDto updated = contactService.updateContact(userId, id, contactDto);
            ApiResponse<ContactDto> response = ApiResponse.success("Contact updated successfully", updated);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to update contact {} for user {}: {}", id, userId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Deletes a contact.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContact(
            @RequestParam(defaultValue = "1") Long userId,
            @PathVariable Long id) {

        validateUserId(userId);
        Objects.requireNonNull(id, "id must not be null");

        try {
            contactService.deleteContact(userId, id);
            ApiResponse<Void> response = ApiResponse.success("Contact deleted successfully", null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to delete contact {} for user {}: {}", id, userId, e.getMessage(), e);
            throw e;
        }
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (userId <= 0) {
            throw new IllegalArgumentException("userId must be positive, got: " + userId);
        }
    }
}
