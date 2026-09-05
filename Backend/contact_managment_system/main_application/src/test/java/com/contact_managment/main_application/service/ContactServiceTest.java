package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.ContactEmail;
import com.contact_managment.main_application.entity.ContactPhone;
import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.exception.DuplicatePhoneNumberException;
import com.contact_managment.main_application.exception.ResourceNotFoundException;
import com.contact_managment.main_application.repository.ContactRepository;
import com.contact_managment.main_application.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock
    private ContactRepository contactRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ContactService contactService;

    private User sampleUser;
    private Contact sampleContact;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Smith")
                .email("jane@example.com")
                .build();

        sampleContact = Contact.builder()
                .id(10L)
                .user(sampleUser)
                .firstName("Alice")
                .lastName("Wonderland")
                .title("Senior Developer")
                .notes("Friend from tech conference")
                .build();
    }

    @Test
    @DisplayName("Should create contact successfully")
    void createContact_Success() {
        ContactDto contactDto = ContactDto.builder()
                .firstName("Alice")
                .lastName("Wonderland")
                .title("Senior Developer")
                .emails(List.of(ContactEmailDto.builder().email("alice@work.com").label("WORK").build()))
                .phones(List.of(ContactPhoneDto.builder().phoneNumber("+111222333").label("MOBILE").build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.save(any(Contact.class))).thenReturn(sampleContact);

        ContactDto result = contactService.createContact(1L, contactDto);

        assertNotNull(result);
        assertEquals("Alice", result.getFirstName());

        org.mockito.ArgumentCaptor<Contact> contactCaptor = org.mockito.ArgumentCaptor.forClass(Contact.class);
        verify(contactRepository, times(1)).save(contactCaptor.capture());
        Contact capturedContact = contactCaptor.getValue();
        assertEquals(sampleUser, capturedContact.getUser());
        assertEquals("Alice", capturedContact.getFirstName());
        assertEquals("Wonderland", capturedContact.getLastName());
        assertEquals(1, capturedContact.getEmails().size());
        assertEquals("alice@work.com", capturedContact.getEmails().get(0).getEmail());
        assertEquals(1, capturedContact.getPhones().size());
        assertEquals("+111222333", capturedContact.getPhones().get(0).getPhoneNumber());
    }

    @Test
    @DisplayName("Should reset duplicate strike count to 0 upon successful contact creation")
    void createContact_ResetsPriorStrikeCountOnSuccess() {
        sampleUser.setDuplicateStrikeCount(1);
        ContactDto dto = ContactDto.builder()
                .firstName("Alice")
                .lastName("Smith")
                .phones(List.of(ContactPhoneDto.builder().phoneNumber("+15551112222").label("WORK").build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findPhoneNumbersByUserExcludingContact(sampleUser, null)).thenReturn(List.of());
        when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> {
            Contact c = invocation.getArgument(0);
            c.setId(10L);
            return c;
        });

        ContactDto result = contactService.createContact(1L, dto);

        assertNotNull(result);
        assertEquals(0, sampleUser.getDuplicateStrikeCount());
        verify(userRepository).saveAndFlush(sampleUser);
    }

    @Test
    @DisplayName("Should fetch paginated contacts without search query")
    void getContacts_Paginated() {
        Page<Contact> contactPage = new PageImpl<>(List.of(sampleContact), PageRequest.of(0, 10), 1);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findByUser(eq(sampleUser), any(Pageable.class))).thenReturn(contactPage);

        PagedResponse<ContactDto> response = contactService.getContacts(1L, null, 0, 10, "firstName", "asc");

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());
        assertEquals("Alice", response.getContent().get(0).getFirstName());
    }

    @Test
    @DisplayName("Should update existing contact successfully and replace nested email/phone children")
    void updateContact_Success() {
        ContactEmail oldEmail = ContactEmail.builder().id(101L).email("old@example.com").label("WORK").build();
        ContactPhone oldPhone = ContactPhone.builder().id(201L).phoneNumber("+123456789").label("WORK").build();
        sampleContact.addEmail(oldEmail);
        sampleContact.addPhone(oldPhone);

        ContactDto updateDto = ContactDto.builder()
                .firstName("Alice Updated")
                .lastName("Wonderland")
                .title("Lead Engineer")
                .emails(List.of(ContactEmailDto.builder().email("new@example.com").label("PERSONAL").build()))
                .phones(List.of(ContactPhoneDto.builder().phoneNumber("+987654321").label("MOBILE").build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findByIdAndUser(10L, sampleUser)).thenReturn(Optional.of(sampleContact));
        when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContactDto result = contactService.updateContact(1L, 10L, updateDto);

        assertNotNull(result);
        assertEquals("Alice Updated", result.getFirstName());
        assertEquals(1, result.getEmails().size());
        assertEquals("new@example.com", result.getEmails().get(0).getEmail());
        assertEquals(1, result.getPhones().size());
        assertEquals("+987654321", result.getPhones().get(0).getPhoneNumber());

        // Verify old children had back-references removed
        assertNull(oldEmail.getContact());
        assertNull(oldPhone.getContact());

        // Verify replacement children reference sampleContact
        assertEquals(1, sampleContact.getEmails().size());
        assertEquals(sampleContact, sampleContact.getEmails().get(0).getContact());
        assertEquals(1, sampleContact.getPhones().size());
        assertEquals(sampleContact, sampleContact.getPhones().get(0).getContact());

        verify(contactRepository, times(1)).save(sampleContact);
    }

    @Test
    @DisplayName("Should stream and export contacts for user successfully")
    void exportContacts_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.streamByUser(sampleUser)).thenReturn(java.util.stream.Stream.of(sampleContact));

        List<ContactDto> exported = contactService.exportContacts(1L);

        assertNotNull(exported);
        assertEquals(1, exported.size());
        assertEquals("Alice", exported.get(0).getFirstName());
    }

    @Test
    @DisplayName("Should delete contact successfully")
    void deleteContact_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findByIdAndUser(10L, sampleUser)).thenReturn(Optional.of(sampleContact));

        contactService.deleteContact(1L, 10L);

        verify(contactRepository, times(1)).delete(sampleContact);
    }

    @Test
    @DisplayName("Should throw exception when contact to delete is not found")
    void deleteContact_NotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findByIdAndUser(99L, sampleUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> contactService.deleteContact(1L, 99L));
    }

    @Test
    @DisplayName("Should throw exception when page is negative")
    void getContacts_NegativePage_ThrowsBadRequest() {
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.getContacts(1L, null, -1, 10, "firstName", "asc"));
    }

    @Test
    @DisplayName("Should throw exception when size is zero or exceeds maximum")
    void getContacts_InvalidSize_ThrowsBadRequest() {
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.getContacts(1L, null, 0, 0, "firstName", "asc"));

        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.getContacts(1L, null, 0, 101, "firstName", "asc"));
    }

    @Test
    @DisplayName("Should throw exception when sort field is invalid")
    void getContacts_InvalidSortField_ThrowsBadRequest() {
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.getContacts(1L, null, 0, 10, "invalidField", "asc"));
    }

    @Test
    @DisplayName("Should throw exception when sort direction is invalid")
    void getContacts_InvalidSortDir_ThrowsBadRequest() {
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.getContacts(1L, null, 0, 10, "firstName", "sideways"));
    }

    @Test
    @DisplayName("Should throw BadRequestException when createContact receives null contactDto")
    void createContact_NullDto_ThrowsBadRequest() {
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.createContact(1L, null));
    }

    @Test
    @DisplayName("Should throw BadRequestException when updateContact receives null contactDto")
    void updateContact_NullDto_ThrowsBadRequest() {
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.updateContact(1L, 10L, null));
    }

    @Test
    @DisplayName("Should throw DuplicatePhoneNumberException when phone number is duplicated within payload")
    void createContact_DuplicatePhoneInPayload_ThrowsException() {
        ContactDto dto = ContactDto.builder()
                .firstName("Test")
                .lastName("User")
                .phones(List.of(
                        ContactPhoneDto.builder().phoneNumber("+1234567890").label("WORK").build(),
                        ContactPhoneDto.builder().phoneNumber("+1234567890").label("MOBILE").build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        assertThrows(DuplicatePhoneNumberException.class, () -> contactService.createContact(1L, dto));
    }

    @Test
    @DisplayName("Should throw DuplicatePhoneNumberException when phone number exists in another contact")
    void createContact_DuplicatePhoneAcrossContacts_ThrowsException() {
        ContactDto dto = ContactDto.builder()
                .firstName("Test")
                .lastName("User")
                .phones(List.of(
                        ContactPhoneDto.builder().phoneNumber("+1234567890").label("WORK").build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findPhoneNumbersByUserExcludingContact(sampleUser, null))
                .thenReturn(List.of("+1234567890"));

        assertThrows(DuplicatePhoneNumberException.class, () -> contactService.createContact(1L, dto));
    }

    @Test
    @DisplayName("Should throw DuplicatePhoneNumberException when phone number matches user's profile phone on create")
    void createContact_DuplicateProfilePhone_ThrowsException() {
        sampleUser.setPhone("+1 (555) 234-5678");
        ContactDto dto = ContactDto.builder()
                .firstName("Test")
                .lastName("User")
                .phones(List.of(
                        ContactPhoneDto.builder().phoneNumber("+15552345678").label("WORK").build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findPhoneNumbersByUserExcludingContact(sampleUser, null))
                .thenReturn(List.of());

        assertThrows(DuplicatePhoneNumberException.class, () -> contactService.createContact(1L, dto));
    }

    @Test
    @DisplayName("Should throw DuplicatePhoneNumberException when phone number matches user's profile phone on update")
    void updateContact_DuplicateProfilePhone_ThrowsException() {
        sampleUser.setPhone("+1 (555) 234-5678");
        ContactDto dto = ContactDto.builder()
                .firstName("Test")
                .lastName("User")
                .phones(List.of(
                        ContactPhoneDto.builder().phoneNumber("+15552345678").label("WORK").build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findByIdAndUser(10L, sampleUser)).thenReturn(Optional.of(sampleContact));
        when(contactRepository.findPhoneNumbersByUserExcludingContact(sampleUser, 10L))
                .thenReturn(List.of());

        assertThrows(DuplicatePhoneNumberException.class, () -> contactService.updateContact(1L, 10L, dto));
    }

    @Test
    @DisplayName("Should increment strike count to 1 and persist warning when first duplicate phone is rejected")
    void createContact_Strike1_PersistsStrikeAndReturnsWarning() {
        sampleUser.setDuplicateStrikeCount(0);
        ContactDto dto = ContactDto.builder()
                .firstName("Test")
                .lastName("User")
                .phones(List.of(
                        ContactPhoneDto.builder().phoneNumber("+15551234567").label("WORK").build(),
                        ContactPhoneDto.builder().phoneNumber("+15551234567").label("HOME").build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        DuplicatePhoneNumberException ex = assertThrows(DuplicatePhoneNumberException.class,
                () -> contactService.createContact(1L, dto));

        assertEquals(1, ex.getStrike());
        assertFalse(ex.isAccountClosed());
        assertEquals(1, sampleUser.getDuplicateStrikeCount());
        verify(userRepository).saveAndFlush(sampleUser);
        verify(userRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should increment strike to 2, purge contacts, and delete user account on repeat duplicate violation")
    void createContact_Strike2_PurgesContactsAndDeletesAccount() {
        sampleUser.setDuplicateStrikeCount(1);
        ContactDto dto = ContactDto.builder()
                .firstName("Test")
                .lastName("User")
                .phones(List.of(
                        ContactPhoneDto.builder().phoneNumber("+15551234567").label("WORK").build(),
                        ContactPhoneDto.builder().phoneNumber("+15551234567").label("HOME").build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findByUser(sampleUser)).thenReturn(List.of(sampleContact));

        DuplicatePhoneNumberException ex = assertThrows(DuplicatePhoneNumberException.class,
                () -> contactService.createContact(1L, dto));

        assertEquals(2, ex.getStrike());
        assertTrue(ex.isAccountClosed());
        assertEquals(2, sampleUser.getDuplicateStrikeCount());
        verify(contactRepository).deleteAll(List.of(sampleContact));
        verify(userRepository).delete(sampleUser);
    }

    @Test
    @DisplayName("Should configure importContacts with noRollbackFor DuplicatePhoneNumberException")
    void importContacts_TransactionConfiguredWithNoRollbackForDuplicateException() throws NoSuchMethodException {
        java.lang.reflect.Method method = ContactService.class.getMethod("importContacts", Long.class, List.class);
        org.springframework.transaction.annotation.Transactional tx =
                method.getAnnotation(org.springframework.transaction.annotation.Transactional.class);
        assertNotNull(tx, "importContacts should be annotated with @Transactional");
        assertTrue(java.util.Arrays.asList(tx.noRollbackFor()).contains(DuplicatePhoneNumberException.class));
    }

    @Test
    @DisplayName("Should import valid contacts successfully")
    void importContacts_Success() {
        ContactDto dto1 = ContactDto.builder()
                .firstName("Alice")
                .lastName("Smith")
                .phones(List.of(ContactPhoneDto.builder().phoneNumber("+15551112222").label("WORK").build()))
                .build();
        ContactDto dto2 = ContactDto.builder()
                .firstName("Bob")
                .lastName("Jones")
                .phones(List.of(ContactPhoneDto.builder().phoneNumber("+15553334444").label("HOME").build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.save(any(Contact.class))).thenReturn(sampleContact);

        int count = contactService.importContacts(1L, List.of(dto1, dto2));

        assertEquals(2, count);
        verify(contactRepository, times(2)).save(any(Contact.class));
    }

    @Test
    @DisplayName("Should save prior valid contact and apply strike when subsequent contact in batch is duplicate")
    void importContacts_ValidContactThenDuplicate_SavesPriorContactAndAppliesStrike() {
        sampleUser.setDuplicateStrikeCount(0);
        ContactDto validDto = ContactDto.builder()
                .firstName("Valid")
                .lastName("Contact")
                .phones(List.of(ContactPhoneDto.builder().phoneNumber("+15551112222").label("WORK").build()))
                .build();
        ContactDto duplicateDto = ContactDto.builder()
                .firstName("Duplicate")
                .lastName("Contact")
                .phones(List.of(ContactPhoneDto.builder().phoneNumber("+15559998888").label("WORK").build()))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.save(any(Contact.class))).thenReturn(sampleContact);
        when(contactRepository.findPhoneNumbersByUserExcludingContact(sampleUser, null))
                .thenReturn(List.of())
                .thenReturn(List.of("+15559998888"));

        DuplicatePhoneNumberException ex = assertThrows(DuplicatePhoneNumberException.class,
                () -> contactService.importContacts(1L, List.of(validDto, duplicateDto)));

        assertEquals(1, ex.getStrike());
        assertFalse(ex.isAccountClosed());
        assertEquals(1, sampleUser.getDuplicateStrikeCount());

        // Verify valid contact was persisted before the duplicate exception
        verify(contactRepository, times(1)).save(any(Contact.class));
        // Verify strike update was persisted
        verify(userRepository).saveAndFlush(sampleUser);
    }

    @Test
    @DisplayName("Should throw BadRequestException on empty list or null contact in importContacts")
    void importContacts_ValidationPreserved() {
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.importContacts(1L, List.of()));

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        List<ContactDto> listWithNull = java.util.Collections.singletonList(null);
        assertThrows(com.contact_managment.main_application.exception.BadRequestException.class,
                () -> contactService.importContacts(1L, listWithNull));
    }
}
