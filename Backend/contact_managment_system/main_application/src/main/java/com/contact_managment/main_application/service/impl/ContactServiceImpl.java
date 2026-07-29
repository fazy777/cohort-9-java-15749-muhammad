package com.contact_managment.main_application.service.impl;

import com.contact_managment.main_application.dto.ContactDto;
import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.exception.ResourceNotFoundException;
import com.contact_managment.main_application.repository.ContactRepository;
import com.contact_managment.main_application.service.ContactService;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of ContactService with proper DI, exception handling, and null checks.
 * HIGH priority fixes: exception handling, null checks.
 */
@Service
@Transactional
public class ContactServiceImpl implements ContactService {

    private static final Logger logger = LoggerFactory.getLogger(ContactServiceImpl.class);

    private final ContactRepository contactRepository;

    /**
     * Constructor injection - preferred over field injection for testability and OOP.
     *
     * @param contactRepository repository dependency, must not be null
     */
    public ContactServiceImpl(ContactRepository contactRepository) {
        this.contactRepository = Objects.requireNonNull(contactRepository, "contactRepository must not be null");
    }

    @Override
    @Transactional
    public ContactDto createContact(Long userId, ContactDto contactDto) {
        validateUserId(userId);
        Objects.requireNonNull(contactDto, "contactDto must not be null");

        try {
            logger.info("Creating contact for userId: {}", userId);
            Contact contact = mapToEntity(contactDto);
            contact.setUserId(userId);

            Contact saved = contactRepository.save(contact);
            if (saved == null) {
                throw new IllegalStateException("Failed to save contact - repository returned null");
            }
            logger.debug("Contact created with id: {}", saved.getId());
            return mapToDto(saved);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid argument while creating contact: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error while creating contact for userId {}: {}", userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to create contact", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ContactDto getContactById(Long userId, Long contactId) {
        validateUserId(userId);
        Objects.requireNonNull(contactId, "contactId must not be null");

        try {
            Contact contact = contactRepository.findByUserIdAndId(userId, contactId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", "id", contactId));
            return mapToDto(contact);
        } catch (ResourceNotFoundException e) {
            logger.warn("Contact not found: userId={}, contactId={}", userId, contactId);
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving contact id {} for user {}: {}", contactId, userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to retrieve contact", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContactDto> getAllContacts(Long userId, Pageable pageable) {
        validateUserId(userId);
        Objects.requireNonNull(pageable, "pageable must not be null");

        try {
            Page<Contact> contacts = contactRepository.findByUserId(userId, pageable);
            if (contacts == null) {
                logger.warn("Repository returned null page for userId {}", userId);
                return Page.empty(pageable);
            }
            return contacts.map(this::mapToDto);
        } catch (Exception e) {
            logger.error("Error retrieving contacts for user {}: {}", userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to retrieve contacts", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactDto> getAllContactsByUserId(Long userId) {
        validateUserId(userId);
        try {
            List<Contact> contacts = contactRepository.findByUserIdOrderByLastNameAsc(userId);
            if (contacts == null) {
                logger.warn("Repository returned null list for userId {}", userId);
                return Collections.emptyList();
            }
            return contacts.stream()
                    .filter(Objects::nonNull)
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error retrieving all contacts for user {}: {}", userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to retrieve contacts", e);
        }
    }

    @Override
    @Transactional
    public ContactDto updateContact(Long userId, Long contactId, ContactDto contactDto) {
        validateUserId(userId);
        Objects.requireNonNull(contactId, "contactId must not be null");
        Objects.requireNonNull(contactDto, "contactDto must not be null");

        try {
            Contact existing = contactRepository.findByUserIdAndId(userId, contactId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", "id", contactId));

            // Null-safe update with validation
            if (contactDto.getFirstName() != null) {
                existing.setFirstName(contactDto.getFirstName());
            }
            if (contactDto.getLastName() != null) {
                existing.setLastName(contactDto.getLastName());
            }
            existing.setTitle(contactDto.getTitle());
            existing.setEmail(contactDto.getEmail());
            existing.setPhone(contactDto.getPhone());

            Contact updated = contactRepository.save(existing);
            logger.info("Updated contact id {} for user {}", contactId, userId);
            return mapToDto(updated);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error updating contact {} for user {}: {}", contactId, userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to update contact", e);
        }
    }

    @Override
    @Transactional
    public void deleteContact(Long userId, Long contactId) {
        validateUserId(userId);
        Objects.requireNonNull(contactId, "contactId must not be null");

        try {
            Contact existing = contactRepository.findByUserIdAndId(userId, contactId)
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", "id", contactId));
            contactRepository.delete(existing);
            logger.info("Deleted contact id {} for user {}", contactId, userId);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting contact {} for user {}: {}", contactId, userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to delete contact", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContactDto> searchContacts(Long userId, String keyword, Pageable pageable) {
        validateUserId(userId);
        Objects.requireNonNull(keyword, "keyword must not be null");
        Objects.requireNonNull(pageable, "pageable must not be null");

        try {
            if (keyword.trim().isEmpty()) {
                return getAllContacts(userId, pageable);
            }
            Page<Contact> results = contactRepository
                    .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                            keyword, keyword, pageable);
            if (results == null) {
                return Page.empty(pageable);
            }
            return results.map(this::mapToDto);
        } catch (Exception e) {
            logger.error("Error searching contacts with keyword {} for user {}: {}", keyword, userId, e.getMessage(), e);
            throw new IllegalStateException("Failed to search contacts", e);
        }
    }

    private void validateUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (userId <= 0) {
            throw new IllegalArgumentException("userId must be positive");
        }
    }

    private Contact mapToEntity(ContactDto dto) {
        if (dto == null) {
            throw new IllegalArgumentException("ContactDto must not be null");
        }
        Contact contact = new Contact();
        contact.setId(dto.getId());
        // Null checks for required fields
        if (dto.getFirstName() == null || dto.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("First name must not be null or blank");
        }
        if (dto.getLastName() == null || dto.getLastName().trim().isEmpty()) {
            throw new IllegalArgumentException("Last name must not be null or blank");
        }
        contact.setFirstName(dto.getFirstName());
        contact.setLastName(dto.getLastName());
        contact.setTitle(dto.getTitle());
        contact.setEmail(dto.getEmail());
        contact.setPhone(dto.getPhone());
        return contact;
    }

    private ContactDto mapToDto(Contact entity) {
        if (entity == null) {
            throw new IllegalArgumentException("Contact entity must not be null");
        }
        return ContactDto.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .title(entity.getTitle())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .build();
    }
}
