package com.contact_managment.main_application.service;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.User;
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
                .emails(new ArrayList<>())
                .phones(new ArrayList<>())
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
        verify(contactRepository, times(1)).save(any(Contact.class));
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
    @DisplayName("Should update existing contact successfully")
    void updateContact_Success() {
        ContactDto updateDto = ContactDto.builder()
                .firstName("Alice Updated")
                .lastName("Wonderland")
                .title("Lead Engineer")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findByIdAndUser(10L, sampleUser)).thenReturn(Optional.of(sampleContact));
        when(contactRepository.save(any(Contact.class))).thenReturn(sampleContact);

        ContactDto result = contactService.updateContact(1L, 10L, updateDto);

        assertNotNull(result);
        verify(contactRepository, times(1)).save(sampleContact);
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
}
