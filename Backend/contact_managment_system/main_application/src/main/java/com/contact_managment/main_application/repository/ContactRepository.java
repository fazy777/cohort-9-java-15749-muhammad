package com.contact_managment.main_application.repository;

import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    Page<Contact> findByUser(User user, Pageable pageable);

    @Query("SELECT DISTINCT c FROM Contact c " +
           "LEFT JOIN c.emails e " +
           "LEFT JOIN c.phones p " +
           "WHERE c.user = :user AND (" +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.phoneNumber LIKE CONCAT('%', :query, '%'))")
    Page<Contact> searchByUserAndQuery(@Param("user") User user, @Param("query") String query, Pageable pageable);

    Optional<Contact> findByIdAndUser(Long id, User user);

    List<Contact> findByUser(User user);
}
