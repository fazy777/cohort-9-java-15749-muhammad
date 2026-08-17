package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.ContactEmail;
import com.contact_managment.main_application.entity.ContactPhone;
import com.contact_managment.main_application.entity.User;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PagedResponse<ContactDto> getContacts(Long userId, String search, int page, int size, String sortBy, String sortDir) {
        log.debug("Fetching contacts for user ID: {}, search: '{}', page: {}, size: {}", userId, search, page, size);

        User user = getUserById(userId);

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
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

    @Transactional(readOnly = true)
    public ContactDto getContactById(Long userId, Long contactId) {
        log.debug("Fetching contact ID: {} for user ID: {}", contactId, userId);
        User user = getUserById(userId);
        Contact contact = contactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with ID: " + contactId));

        return mapToDto(contact);
    }

    @Transactional
    public ContactDto createContact(Long userId, ContactDto contactDto) {
        log.info("Creating new contact for user ID: {} with name: {} {}", userId, contactDto.getFirstName(), contactDto.getLastName());
        User user = getUserById(userId);

        Contact contact = Contact.builder()
                .user(user)
                .firstName(contactDto.getFirstName())
                .lastName(contactDto.getLastName())
                .title(contactDto.getTitle())
                .notes(contactDto.getNotes())
                .emails(new ArrayList<>())
                .phones(new ArrayList<>())
                .build();

        if (contactDto.getEmails() != null) {
            for (ContactEmailDto emailDto : contactDto.getEmails()) {
                ContactEmail email = ContactEmail.builder()
                        .email(emailDto.getEmail())
                        .label(emailDto.getLabel() != null ? emailDto.getLabel() : "WORK")
                        .build();
                contact.addEmail(email);
            }
        }

        if (contactDto.getPhones() != null) {
            for (ContactPhoneDto phoneDto : contactDto.getPhones()) {
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

    @Transactional
    public ContactDto updateContact(Long userId, Long contactId, ContactDto contactDto) {
        log.info("Updating contact ID: {} for user ID: {}", contactId, userId);
        User user = getUserById(userId);

        Contact contact = contactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with ID: " + contactId));

        contact.setFirstName(contactDto.getFirstName());
        contact.setLastName(contactDto.getLastName());
        contact.setTitle(contactDto.getTitle());
        contact.setNotes(contactDto.getNotes());

        contact.getEmails().clear();
        if (contactDto.getEmails() != null) {
            for (ContactEmailDto emailDto : contactDto.getEmails()) {
                ContactEmail email = ContactEmail.builder()
                        .email(emailDto.getEmail())
                        .label(emailDto.getLabel() != null ? emailDto.getLabel() : "WORK")
                        .build();
                contact.addEmail(email);
            }
        }

        contact.getPhones().clear();
        if (contactDto.getPhones() != null) {
            for (ContactPhoneDto phoneDto : contactDto.getPhones()) {
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

    @Transactional
    public void deleteContact(Long userId, Long contactId) {
        log.info("Deleting contact ID: {} for user ID: {}", contactId, userId);
        User user = getUserById(userId);

        Contact contact = contactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with ID: " + contactId));

        contactRepository.delete(contact);
        log.info("Contact ID: {} deleted successfully", contactId);
    }

    @Transactional(readOnly = true)
    public List<ContactDto> exportContacts(Long userId) {
        log.info("Exporting all contacts for user ID: {}", userId);
        User user = getUserById(userId);
        List<Contact> contacts = contactRepository.findByUser(user);
        return contacts.stream().map(this::mapToDto).toList();
    }

    @Transactional
    public int importContacts(Long userId, List<ContactDto> contactDtos) {
        log.info("Importing {} contacts for user ID: {}", contactDtos.size(), userId);
        int count = 0;
        for (ContactDto dto : contactDtos) {
            if (StringUtils.hasText(dto.getFirstName()) && StringUtils.hasText(dto.getLastName())) {
                createContact(userId, dto);
                count++;
            }
        }
        log.info("Successfully imported {} contacts", count);
        return count;
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

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
}
