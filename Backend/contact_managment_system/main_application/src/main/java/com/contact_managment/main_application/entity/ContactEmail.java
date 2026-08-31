package com.contact_managment.main_application.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing an email address associated with a Contact.
 */
@Entity
@Table(name = "contact_emails")
@Getter
@Setter
@NoArgsConstructor
public class ContactEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 50)
    private String label; // e.g. WORK, PERSONAL, OTHER

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id", nullable = false)
    @JsonBackReference("contact-emails")
    @Setter(AccessLevel.PACKAGE)
    private Contact contact;

    /**
     * Constructor used by Lombok's builder.
     * Excludes the contact reference so construction cannot bypass
     * Contact relationship management methods (e.g. Contact.addEmail).
     */
    @Builder
    public ContactEmail(Long id, String email, String label) {
        this.id = id;
        this.email = email;
        this.label = label;
    }
}
