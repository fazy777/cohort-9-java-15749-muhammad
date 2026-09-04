package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.ContactEmail;
import com.contact_managment.main_application.entity.ContactPhone;
import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.exception.BadRequestException;
import com.contact_managment.main_application.exception.DuplicatePhoneNumberException;
import com.contact_managment.main_application.exception.ResourceNotFoundException;
import com.contact_managment.main_application.repository.ContactRepository;
import com.contact_managment.main_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Service providing contact CRUD operations, filtered search, pagination, bulk import/export, and user association.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "firstName", "lastName", "title", "createdAt", "updatedAt");
    private static final int MAX_PAGE_SIZE = 100;

    /**
     * Retrieves paginated contacts for a user with optional text filtering and sorting.
     *
     * @param userId user ID owning the contacts
     * @param search text search query across names, title, emails, and phones
     * @param page zero-based page number
     * @param size number of records per page
     * @param sortBy field name to sort by
     * @param sortDir sorting direction ("asc" or "desc")
     * @return paginated response containing contact DTOs
     */
    @Transactional(readOnly = true)
    public PagedResponse<ContactDto> getContacts(Long userId, String search, int page, int size, String sortBy, String sortDir) {
        log.debug("Fetching contacts for userId={}, page={}, size={}, searchProvided={}", userId, page, size, StringUtils.hasText(search));

        if (page < 0) {
            throw new BadRequestException("Page index must not be less than zero");
        }
        if (size <= 0) {
            throw new BadRequestException("Page size must be greater than zero");
        }
        if (size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must not exceed " + MAX_PAGE_SIZE);
        }
        if (!StringUtils.hasText(sortBy)) {
            throw new BadRequestException("Invalid sort field provided. Allowed fields are: " + String.join(", ", ALLOWED_SORT_FIELDS));
        }
        String trimmedSortBy = sortBy.trim();
        if (!ALLOWED_SORT_FIELDS.contains(trimmedSortBy)) {
            throw new BadRequestException("Invalid sort field provided. Allowed fields are: " + String.join(", ", ALLOWED_SORT_FIELDS));
        }

        if (!StringUtils.hasText(sortDir)) {
            throw new BadRequestException("Invalid sort direction provided. Allowed values are 'asc' or 'desc'");
        }
        String trimmedSortDir = sortDir.trim();
        if (!trimmedSortDir.equalsIgnoreCase("asc") && !trimmedSortDir.equalsIgnoreCase("desc")) {
            throw new BadRequestException("Invalid sort direction provided. Allowed values are 'asc' or 'desc'");
        }

        User user = getUserById(userId);

        Sort sort = trimmedSortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(trimmedSortBy).ascending() : Sort.by(trimmedSortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Contact> contactPage;
        if (StringUtils.hasText(search)) {
            contactPage = contactRepository.searchByUserAndQuery(user, search.trim(), pageable);
        } else {
            contactPage = contactRepository.findByUser(user, pageable);
        }

        List<ContactDto> content = contactPage.getContent().stream()
                .map(this::mapToDto)
                .toList();

        return PagedResponse.<ContactDto>builder()
                .content(content)
                .page(contactPage.getNumber())
                .size(contactPage.getSize())
                .totalElements(contactPage.getTotalElements())
                .totalPages(contactPage.getTotalPages())
                .last(contactPage.isLast())
                .build();
    }

    /**
     * Retrieves a single contact by its ID for a specific user.
     *
     * @param userId user ID owning the contact
     * @param contactId contact identifier
     * @return contact DTO
     * @throws ResourceNotFoundException if the contact is not found
     */
    @Transactional(readOnly = true)
    public ContactDto getContactById(Long userId, Long contactId) {
        log.debug("Fetching contact ID: {} for user ID: {}", contactId, userId);
        User user = getUserById(userId);
        Contact contact = contactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with ID: " + contactId));

        return mapToDto(contact);
    }

    /**
     * Creates and saves a new contact for the specified user.
     *
     * @param userId user ID creating the contact
     * @param contactDto contact data
     * @return saved contact DTO
     */
    @Transactional
    public ContactDto createContact(Long userId, ContactDto contactDto) {
        log.info("Creating new contact for user ID: {}", userId);
        if (contactDto == null) {
            throw new BadRequestException("Contact data cannot be null");
        }
        User user = getUserById(userId);
        return createContactInternal(user, contactDto);
    }

    /**
     * Internal helper to persist a contact for a pre-loaded user entity.
     *
     * @param user the pre-loaded User entity
     * @param contactDto contact data
     * @return saved contact DTO
     */
    private ContactDto createContactInternal(User user, ContactDto contactDto) {
        validatePhoneNumbers(user, contactDto.getPhones(), null);

        Contact contact = Contact.builder()
                .user(user)
                .firstName(contactDto.getFirstName())
                .lastName(contactDto.getLastName())
                .title(contactDto.getTitle())
                .notes(contactDto.getNotes())
                .build();

        if (contactDto.getEmails() != null) {
            for (ContactEmailDto emailDto : contactDto.getEmails()) {
                if (emailDto == null) {
                    throw new BadRequestException("Email entry cannot be null");
                }
                ContactEmail email = ContactEmail.builder()
                        .email(emailDto.getEmail())
                        .label(emailDto.getLabel() != null ? emailDto.getLabel() : "WORK")
                        .build();
                contact.addEmail(email);
            }
        }

        if (contactDto.getPhones() != null) {
            for (ContactPhoneDto phoneDto : contactDto.getPhones()) {
                if (phoneDto == null) {
                    throw new BadRequestException("Phone entry cannot be null");
                }
                ContactPhone phone = ContactPhone.builder()
                        .phoneNumber(phoneDto.getPhoneNumber())
                        .label(phoneDto.getLabel() != null ? phoneDto.getLabel() : "WORK")
                        .build();
                contact.addPhone(phone);
            }
        }

        Contact savedContact = contactRepository.save(contact);
        log.info("Contact created successfully with ID: {}", savedContact.getId());
        return mapToDto(savedContact);
    }

    /**
     * Updates an existing contact's details, email addresses, and phone numbers.
     *
     * @param userId user ID owning the contact
     * @param contactId ID of the contact to update
     * @param contactDto updated contact values
     * @return updated contact DTO
     * @throws ResourceNotFoundException if the contact is not found
     */
    @Transactional
    public ContactDto updateContact(Long userId, Long contactId, ContactDto contactDto) {
        log.info("Updating contact ID: {} for user ID: {}", contactId, userId);
        if (contactDto == null) {
            throw new BadRequestException("Contact data cannot be null");
        }
        User user = getUserById(userId);

        Contact contact = contactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with ID: " + contactId));

        validatePhoneNumbers(user, contactDto.getPhones(), contactId);

        contact.setFirstName(contactDto.getFirstName());
        contact.setLastName(contactDto.getLastName());
        contact.setTitle(contactDto.getTitle());
        contact.setNotes(contactDto.getNotes());

        if (contact.getEmails() != null) {
            new ArrayList<>(contact.getEmails()).forEach(contact::removeEmail);
        }
        if (contactDto.getEmails() != null) {
            for (ContactEmailDto emailDto : contactDto.getEmails()) {
                if (emailDto == null) {
                    throw new BadRequestException("Email entry cannot be null");
                }
                ContactEmail email = ContactEmail.builder()
                        .email(emailDto.getEmail())
                        .label(emailDto.getLabel() != null ? emailDto.getLabel() : "WORK")
                        .build();
                contact.addEmail(email);
            }
        }

        if (contact.getPhones() != null) {
            new ArrayList<>(contact.getPhones()).forEach(contact::removePhone);
        }
        if (contactDto.getPhones() != null) {
            for (ContactPhoneDto phoneDto : contactDto.getPhones()) {
                if (phoneDto == null) {
                    throw new BadRequestException("Phone entry cannot be null");
                }
                ContactPhone phone = ContactPhone.builder()
                        .phoneNumber(phoneDto.getPhoneNumber())
                        .label(phoneDto.getLabel() != null ? phoneDto.getLabel() : "WORK")
                        .build();
                contact.addPhone(phone);
            }
        }

        Contact updatedContact = contactRepository.save(contact);
        log.info("Contact ID: {} updated successfully", updatedContact.getId());
        return mapToDto(updatedContact);
    }

    /**
     * Deletes a contact belonging to a specific user.
     *
     * @param userId user ID owning the contact
     * @param contactId ID of the contact to delete
     * @throws ResourceNotFoundException if the contact is not found
     */
    @Transactional
    public void deleteContact(Long userId, Long contactId) {
        log.info("Deleting contact ID: {} for user ID: {}", contactId, userId);
        User user = getUserById(userId);

        Contact contact = contactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with ID: " + contactId));

        contactRepository.delete(contact);
        log.info("Contact ID: {} deleted successfully", contactId);
    }

    /**
     * Exports all contacts for a specific user as DTOs.
     *
     * @param userId user ID owning the contacts
     * @return list of contact DTOs
     */
    @Transactional(readOnly = true)
    public List<ContactDto> exportContacts(Long userId) {
        log.info("Exporting all contacts for user ID: {}", userId);
        User user = getUserById(userId);
        try (Stream<Contact> stream = contactRepository.streamByUser(user)) {
            return stream.map(this::mapToDto).toList();
        }
    }

    /**
     * Imports a batch of contact DTOs for a user.
     *
     * @param userId user ID importing the contacts
     * @param contactDtos list of contact DTOs to import
     * @return total count of imported contacts
     */
    @Transactional
    public int importContacts(Long userId, List<ContactDto> contactDtos) {
        if (contactDtos == null || contactDtos.isEmpty()) {
            throw new BadRequestException("Contacts list cannot be empty");
        }
        log.info("Importing {} contacts for user ID: {}", contactDtos.size(), userId);
        User user = getUserById(userId);
        int count = 0;
        for (ContactDto dto : contactDtos) {
            if (dto == null) {
                throw new BadRequestException("Imported contact entry cannot be null");
            }
            if (!StringUtils.hasText(dto.getFirstName()) || !StringUtils.hasText(dto.getLastName())) {
                throw new BadRequestException("First name and Last name are required for all imported contacts");
            }
            createContactInternal(user, dto);
            count++;
        }
        log.info("Successfully imported {} contacts for user ID: {}", count, userId);
        return count;
    }

    /**
     * Helper method to lookup a user entity by ID.
     *
     * @param userId user ID
     * @return User entity
     * @throws ResourceNotFoundException if user is not found
     */
    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    /**
     * Maps a Contact entity to its corresponding ContactDto.
     *
     * @param contact the Contact entity
     * @return ContactDto representation
     */
    private ContactDto mapToDto(Contact contact) {
        List<ContactEmailDto> emailDtos = contact.getEmails().stream()
                .map(e -> ContactEmailDto.builder()
                        .id(e.getId())
                        .email(e.getEmail())
                        .label(e.getLabel())
                        .build())
                .toList();

        List<ContactPhoneDto> phoneDtos = contact.getPhones().stream()
                .map(p -> ContactPhoneDto.builder()
                        .id(p.getId())
                        .phoneNumber(p.getPhoneNumber())
                        .label(p.getLabel())
                        .build())
                .toList();

        return ContactDto.builder()
                .id(contact.getId())
                .firstName(contact.getFirstName())
                .lastName(contact.getLastName())
                .title(contact.getTitle())
                .notes(contact.getNotes())
                .emails(emailDtos)
                .phones(phoneDtos)
                .createdAt(contact.getCreatedAt())
                .updatedAt(contact.getUpdatedAt())
                .build();
    }

    /**
     * Validates that phone numbers in the contact payload do not contain duplicates within the payload,
     * and do not duplicate any phone number belonging to existing contacts of the same user.
     *
     * @param user owning user
     * @param phones list of phone DTOs
     * @param excludeContactId contact ID to exclude from existing lookup (null for create)
     */
    private void validatePhoneNumbers(User user, List<ContactPhoneDto> phones, Long excludeContactId) {
        if (phones == null || phones.isEmpty()) {
            return;
        }

        Set<String> seenInPayload = new java.util.HashSet<>();
        List<String> existingPhones = contactRepository.findPhoneNumbersByUserExcludingContact(user, excludeContactId);
        Set<String> normalizedExisting = existingPhones.stream()
                .filter(StringUtils::hasText)
                .map(this::normalizePhoneNumber)
                .collect(java.util.stream.Collectors.toSet());

        if (user != null && StringUtils.hasText(user.getPhone())) {
            normalizedExisting.add(normalizePhoneNumber(user.getPhone()));
        }

        for (ContactPhoneDto phoneDto : phones) {
            if (phoneDto == null || !StringUtils.hasText(phoneDto.getPhoneNumber())) {
                continue;
            }
            String rawPhone = phoneDto.getPhoneNumber().trim();
            String normalized = normalizePhoneNumber(rawPhone);
            if (normalized.isEmpty()) {
                continue;
            }

            if (!seenInPayload.add(normalized)) {
                throw new DuplicatePhoneNumberException("Duplicate phone number entered within contact: " + rawPhone);
            }

            if (normalizedExisting.contains(normalized)) {
                throw new DuplicatePhoneNumberException("Duplicate phone number detected: " + rawPhone + " already belongs to an existing contact.");
            }
        }
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[\\s\\-\\(\\)\\.]", "").toLowerCase(java.util.Locale.ROOT);
    }
}
