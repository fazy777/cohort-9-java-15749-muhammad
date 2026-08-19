package com.contact_managment.main_application.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class ContactTest {

    @Test
    @DisplayName("Should add email successfully and bind relationship")
    void addEmail_Success() {
        Contact contact = Contact.builder().emails(new ArrayList<>()).build();
        ContactEmail email = ContactEmail.builder().email("test@example.com").label("WORK").build();

        contact.addEmail(email);

        assertEquals(1, contact.getEmails().size());
        assertEquals(contact, email.getContact());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when adding null email")
    void addEmail_Null_ThrowsException() {
        Contact contact = Contact.builder().emails(new ArrayList<>()).build();
        assertThrows(IllegalArgumentException.class, () -> contact.addEmail(null));
    }

    @Test
    @DisplayName("Should remove email successfully and unbind relationship")
    void removeEmail_Success() {
        Contact contact = Contact.builder().emails(new ArrayList<>()).build();
        ContactEmail email = ContactEmail.builder().email("test@example.com").label("WORK").build();
        contact.addEmail(email);

        contact.removeEmail(email);

        assertEquals(0, contact.getEmails().size());
        assertNull(email.getContact());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when removing null email")
    void removeEmail_Null_ThrowsException() {
        Contact contact = Contact.builder().emails(new ArrayList<>()).build();
        assertThrows(IllegalArgumentException.class, () -> contact.removeEmail(null));
    }

    @Test
    @DisplayName("Should add phone successfully and bind relationship")
    void addPhone_Success() {
        Contact contact = Contact.builder().phones(new ArrayList<>()).build();
        ContactPhone phone = ContactPhone.builder().phoneNumber("+1234567890").label("WORK").build();

        contact.addPhone(phone);

        assertEquals(1, contact.getPhones().size());
        assertEquals(contact, phone.getContact());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when adding null phone")
    void addPhone_Null_ThrowsException() {
        Contact contact = Contact.builder().phones(new ArrayList<>()).build();
        assertThrows(IllegalArgumentException.class, () -> contact.addPhone(null));
    }

    @Test
    @DisplayName("Should remove phone successfully and unbind relationship")
    void removePhone_Success() {
        Contact contact = Contact.builder().phones(new ArrayList<>()).build();
        ContactPhone phone = ContactPhone.builder().phoneNumber("+1234567890").label("WORK").build();
        contact.addPhone(phone);

        contact.removePhone(phone);

        assertEquals(0, contact.getPhones().size());
        assertNull(phone.getContact());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when removing null phone")
    void removePhone_Null_ThrowsException() {
        Contact contact = Contact.builder().phones(new ArrayList<>()).build();
        assertThrows(IllegalArgumentException.class, () -> contact.removePhone(null));
    }
}
