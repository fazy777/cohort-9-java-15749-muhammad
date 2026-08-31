package com.contact_managment.main_application.security;

import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Spring Security UserDetailsService implementation that loads user principals by credential (email/phone) or unique ID.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Loads a user by email or phone number.
     *
     * @param credential email address or phone number
     * @return UserDetails representation for Spring Security
     * @throws UsernameNotFoundException if no user or multiple users are found
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String credential) throws UsernameNotFoundException {
        String rawCredential = credential != null ? credential.trim() : "";
        String normalized = rawCredential.toLowerCase(java.util.Locale.ROOT);
        java.util.List<User> users = userRepository.findByEmailOrPhone(normalized);
        if (users.isEmpty() && !rawCredential.equalsIgnoreCase(normalized)) {
            users = userRepository.findByEmailOrPhone(rawCredential);
        }
        if (users.size() != 1) {
            throw new UsernameNotFoundException("User not found or ambiguous credentials provided");
        }
        return UserPrincipal.create(users.get(0));
    }

    /**
     * Loads a user by unique numeric database ID.
     *
     * @param id user primary key
     * @return UserDetails representation for Spring Security
     * @throws UsernameNotFoundException if no user is found
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
        return UserPrincipal.create(user);
    }
}
