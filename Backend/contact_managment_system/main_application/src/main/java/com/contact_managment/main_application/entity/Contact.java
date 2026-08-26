package com.contact_managment.main_application.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing an address book contact owned by a User, with associated emails and phone numbers.
 */
@Entity
@Table(name = "contacts")
@Getter
@Setter
@NoArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(length = 100)
    private String title;

    @Column(length = 500)
    private String notes;

    @OneToMany(
            mappedBy = "contact",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @org.hibernate.annotations.BatchSize(size = 50)
    @JsonManagedReference("contact-emails")
    @Setter(AccessLevel.NONE)
    private List<ContactEmail> emails = new ArrayList<>();

    @OneToMany(
            mappedBy = "contact",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @org.hibernate.annotations.BatchSize(size = 50)
    @JsonManagedReference("contact-phones")
    @Setter(AccessLevel.NONE)
    private List<ContactPhone> phones = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * Constructor used by Lombok's builder.
     *
     * The email and phone collections are intentionally excluded from the builder.
     * They must be added through addEmail() and addPhone() so that the
     * bidirectional relationship is always established correctly.
     */
    @Builder
    public Contact(
            Long id,
            User user,
            String firstName,
            String lastName,
            String title,
            String notes
    ) {
        this.id = id;
        this.user = user;
        this.firstName = firstName;
        this.lastName = lastName;
        this.title = title;
        this.notes = notes;
        this.emails = new ArrayList<>();
        this.phones = new ArrayList<>();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Adds an email entity to this contact and binds bidirectional relationship.
     *
     * @param email the ContactEmail to add
     */
    public void addEmail(ContactEmail email) {
        if (email == null) {
            throw new IllegalArgumentException("ContactEmail cannot be null");
        }

        if (email.getContact() != null && email.getContact() != this) {
            email.getContact().removeEmail(email);
        }

        if (!emails.contains(email)) {
            emails.add(email);
        }

        email.setContact(this);
    }

    /**
     * Removes an email entity from this contact and unbinds relationship.
     *
     * @param email the ContactEmail to remove
     */
    public void removeEmail(ContactEmail email) {
        if (email == null) {
            throw new IllegalArgumentException("ContactEmail cannot be null");
        }

        if (emails.remove(email)) {
            email.setContact(null);
        }
    }

    /**
     * Adds a phone entity to this contact and binds bidirectional relationship.
     *
     * @param phone the ContactPhone to add
     */
    public void addPhone(ContactPhone phone) {
        if (phone == null) {
            throw new IllegalArgumentException("ContactPhone cannot be null");
        }

        if (phone.getContact() != null && phone.getContact() != this) {
            phone.getContact().removePhone(phone);
        }

        if (!phones.contains(phone)) {
            phones.add(phone);
        }

        phone.setContact(this);
    }

    /**
     * Removes a phone entity from this contact and unbinds relationship.
     *
     * @param phone the ContactPhone to remove
     */
    public void removePhone(ContactPhone phone) {
        if (phone == null) {
            throw new IllegalArgumentException("ContactPhone cannot be null");
        }

        if (phones.remove(phone)) {
            phone.setContact(null);
        }
    }
}
