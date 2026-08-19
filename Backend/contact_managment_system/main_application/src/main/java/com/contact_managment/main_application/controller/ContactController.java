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

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    private Long getUserId(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new InvalidCredentialsException("User authentication required");
        }
        return userPrincipal.getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ContactDto>>> getContacts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "firstName") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc") String sortDir) {

        PagedResponse<ContactDto> response = contactService.getContacts(getUserId(userPrincipal), search, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Contacts retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> getContactById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long contactId) {

        ContactDto contact = contactService.getContactById(getUserId(userPrincipal), contactId);
        return ResponseEntity.ok(ApiResponse.success("Contact details retrieved successfully", contact));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ContactDto>> createContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ContactDto contactDto) {

        ContactDto createdContact = contactService.createContact(getUserId(userPrincipal), contactDto);
        return new ResponseEntity<>(ApiResponse.success("Contact created successfully", createdContact), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactDto>> updateContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long contactId,
            @Valid @RequestBody ContactDto contactDto) {

        ContactDto updatedContact = contactService.updateContact(getUserId(userPrincipal), contactId, contactDto);
        return ResponseEntity.ok(ApiResponse.success("Contact updated successfully", updatedContact));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContact(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") Long contactId) {

        contactService.deleteContact(getUserId(userPrincipal), contactId);
        return ResponseEntity.ok(ApiResponse.success("Contact deleted successfully"));
    }

    @GetMapping("/export")
    public ResponseEntity<ApiResponse<List<ContactDto>>> exportContacts(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<ContactDto> contacts = contactService.exportContacts(getUserId(userPrincipal));
        return ResponseEntity.ok(ApiResponse.success("Contacts exported successfully", contacts));
    }

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Integer>> importContacts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody @Valid List<@Valid ContactDto> contactDtos) {

        if (contactDtos == null || contactDtos.isEmpty()) {
            throw new com.contact_managment.main_application.exception.BadRequestException("Import list cannot be empty");
        }
        int importedCount = contactService.importContacts(getUserId(userPrincipal), contactDtos);
        return ResponseEntity.ok(ApiResponse.success("Imported " + importedCount + " contacts successfully", importedCount));
    }
}
