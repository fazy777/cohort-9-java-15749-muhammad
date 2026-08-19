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
@AllArgsConstructor
@Builder
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

    @OneToMany(mappedBy = "contact", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<ContactEmail> emails = new ArrayList<>();

    @OneToMany(mappedBy = "contact", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<ContactPhone> phones = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

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
        emails.add(email);
        email.setContact(this);
    }

    /**
     * Removes an email entity from this contact and unbinds relationship.
     *
     * @param email the ContactEmail to remove
     */
    public void removeEmail(ContactEmail email) {
        emails.remove(email);
        email.setContact(null);
    }

    /**
     * Adds a phone entity to this contact and binds bidirectional relationship.
     *
     * @param phone the ContactPhone to add
     */
    public void addPhone(ContactPhone phone) {
        phones.add(phone);
        phone.setContact(this);
    }

    /**
     * Removes a phone entity from this contact and unbinds relationship.
     *
     * @param phone the ContactPhone to remove
     */
    public void removePhone(ContactPhone phone) {
        phones.remove(phone);
        phone.setContact(null);
    }
}
