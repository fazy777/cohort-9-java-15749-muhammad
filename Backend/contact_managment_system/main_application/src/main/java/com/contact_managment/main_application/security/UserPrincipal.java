package com.contact_managment.main_application.security;

import com.contact_managment.main_application.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * Spring Security UserDetails implementation representing an authenticated user principal with token version tracking.
 */
@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    private Long tokenVersion;

    @JsonIgnore
    private String password;

    private Collection<? extends GrantedAuthority> authorities;

    /**
     * Factory method creating a UserPrincipal from a User entity.
     *
     * @param user the domain User entity
     * @return UserPrincipal instance
     */
    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        return new UserPrincipal(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getTokenVersion() != null ? user.getTokenVersion() : 1L,
                user.getPassword(),
                authorities
        );
    }

    /**
     * Returns the username identifying the user (email if available, otherwise phone).
     *
     * @return username string
     */
    @Override
    public String getUsername() {
        return email != null ? email : phone;
    }

    /**
     * Returns the hashed password for authentication verification.
     *
     * @return password hash string
     */
    @Override
    public String getPassword() {
        return password;
    }

    /**
     * Returns the granted security authorities.
     *
     * @return collection of granted authorities
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /**
     * Indicates whether the user's account has expired.
     *
     * @return true if non-expired
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Indicates whether the user is locked or unlocked.
     *
     * @return true if non-locked
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * Indicates whether the user's credentials (password) has expired.
     *
     * @return true if credentials are valid
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Indicates whether the user is enabled or disabled.
     *
     * @return true if enabled
     */
    @Override
    public boolean isEnabled() {
        return true;
    }
}
