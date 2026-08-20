package com.contact_managment.main_application.controller;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.exception.InvalidCredentialsException;
import com.contact_managment.main_application.security.UserPrincipal;
import com.contact_managment.main_application.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing contacts, supporting CRUD operations, search, pagination, and import/export.
 */
@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
@org.springframework.validation.annotation.Validated
public class ContactController {

    private final ContactService contactService;

    /**
     * Extracts and validates the authenticated user ID.
     *
     * @param userPrincipal the authenticated user principal
     * @return the unique user identifier
     * @throws InvalidCredentialsException if the principal is null
     */
    private Long getUserId(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new InvalidCredentialsException("User authentication required");
        }
        return userPrincipal.getId();
    }

    /**
     * Retrieves a paginated and filtered list of contacts for the authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @param search optional search query to filter contacts by name, email, phone, or title
     * @param page zero-based page index
     * @param size page size limit (max 100)
     * @param sortBy property to sort by
     * @param sortDir sort direction ('asc' or 'desc')
     * @return response entity with paginated contact data
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ContactDto>>> getContacts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(value = "search", required = false) String search,
            @jakarta.validation.constraints.Min(value = 0, message = "Page index must not be less than zero")
            @RequestParam(value = "page", defaultValue = "0") int page,
            @jakarta.validation.constraints.Min(value = 1, message = "Page size must be at least 1")
            @jakarta.validation.constraints.Max(value = 100, message = "Page size cannot exceed 100")
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "firstName") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc") String sortDir) {

        PagedResponse<ContactDto> response = contactService.getContacts(getUserId(userPrincipal), search, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Contacts retrieved successfully", response));
    }

    /**
     * Retrieves a single contact by ID for the authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @param contactId the unique contact ID
     * @return response entity with contact details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> getContactById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long contactId) {

        ContactDto contact = contactService.getContactById(getUserId(userPrincipal), contactId);
        return ResponseEntity.ok(ApiResponse.success("Contact details retrieved successfully", contact));
    }

    /**
     * Creates a new contact for the authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @param contactDto the contact details payload
     * @return response entity with the newly created contact and HTTP 201 Created status
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ContactDto>> createContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ContactDto contactDto) {

        ContactDto createdContact = contactService.createContact(getUserId(userPrincipal), contactDto);
        return new ResponseEntity<>(ApiResponse.success("Contact created successfully", createdContact), HttpStatus.CREATED);
    }

    /**
     * Updates an existing contact for the authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @param contactId the ID of the contact to update
     * @param contactDto the updated contact payload
     * @return response entity with the updated contact details
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> updateContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long contactId,
            @Valid @RequestBody ContactDto contactDto) {

        ContactDto updatedContact = contactService.updateContact(getUserId(userPrincipal), contactId, contactDto);
        return ResponseEntity.ok(ApiResponse.success("Contact updated successfully", updatedContact));
    }

    /**
     * Deletes a contact belonging to the authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @param contactId the ID of the contact to delete
     * @return response entity confirming deletion
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long contactId) {

        contactService.deleteContact(getUserId(userPrincipal), contactId);
        return ResponseEntity.ok(ApiResponse.success("Contact deleted successfully"));
    }

    /**
     * Exports all contacts belonging to the authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @return response entity with the complete list of contacts
     */
    @GetMapping("/export")
    public ResponseEntity<ApiResponse<List<ContactDto>>> exportContacts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<ContactDto> contacts = contactService.exportContacts(getUserId(userPrincipal));
        return ResponseEntity.ok(ApiResponse.success("Contacts exported successfully", contacts));
    }

    /**
     * Imports a batch list of contacts for the authenticated user.
     *
     * @param userPrincipal the authenticated user principal
     * @param contactDtos the list of contacts to import
     * @return response entity with the count of imported contacts
     */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Integer>> importContacts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody @Valid @jakarta.validation.constraints.Size(max = 1000, message = "Cannot import more than 1000 contacts at a time") List<@Valid ContactDto> contactDtos) {

        if (contactDtos == null || contactDtos.isEmpty()) {
            throw new com.contact_managment.main_application.exception.BadRequestException("Import list cannot be empty");
        }
        if (contactDtos.size() > 1000) {
            throw new com.contact_managment.main_application.exception.BadRequestException("Cannot import more than 1000 contacts at a time");
        }
        int importedCount = contactService.importContacts(getUserId(userPrincipal), contactDtos);
        return ResponseEntity.ok(ApiResponse.success("Imported " + importedCount + " contacts successfully", importedCount));
    }
}
