package com.contact_managment.main_application.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing a phone number associated with a Contact.
 */
@Entity
@Table(name = "contact_phones")
@Getter
@Setter
@NoArgsConstructor
public class ContactPhone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String phoneNumber;

    @Column(nullable = false, length = 50)
    private String label; // e.g. WORK, HOME, PERSONAL, MOBILE, OTHER

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id", nullable = false)
    @JsonBackReference("contact-phones")
    @Setter(AccessLevel.PACKAGE)
    private Contact contact;

    /**
     * Constructor used by Lombok's builder.
     * Excludes the contact reference so construction cannot bypass
     * Contact relationship management methods (e.g. Contact.addPhone).
     */
    @Builder
    public ContactPhone(Long id, String phoneNumber, String label) {
        this.id = id;
        this.phoneNumber = phoneNumber;
        this.label = label;
    }
}
