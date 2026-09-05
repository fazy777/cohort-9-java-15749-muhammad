package com.contact_managment.main_application.service;

import com.contact_managment.main_application.entity.Contact;
import com.contact_managment.main_application.entity.User;
import com.contact_managment.main_application.exception.DuplicatePhoneNumberException;
import com.contact_managment.main_application.repository.ContactRepository;
import com.contact_managment.main_application.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * Service encapsulating duplicate phone number detection, canonicalization, and strike enforcement policy.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DuplicatePhonePolicyService {

    private final UserRepository userRepository;
    private final ContactRepository contactRepository;

    /**
     * Canonicalizes a phone number string by removing whitespace, hyphens, parentheses, and dots,
     * and converting to lower case.
     *
     * @param phone raw phone string
     * @return canonical normalized phone string, or empty string if null
     */
    public String normalizePhoneNumber(String phone) {
        if (phone == null) {
            return "";
        }
        return phone.replaceAll("[\\s\\-\\(\\)\\.]", "").toLowerCase(Locale.ROOT);
    }

    /**
     * Atomically increments the user's duplicate strike count, persists the change,
     * and either throws a strike-1 warning or terminates the user account on strike 2.
     *
     * @param user owning user
     * @param rawPhone duplicate phone number string
     * @throws DuplicatePhoneNumberException on both strike 1 (warning) and strike 2 (closure)
     */
    public void handleDuplicateStrikeAndThrow(User user, String rawPhone) {
        if (user == null) {
            throw new DuplicatePhoneNumberException("Duplicate phone number detected: " + rawPhone);
        }

        User targetUser = user;
        if (user.getId() != null) {
            targetUser = userRepository.findByIdForUpdate(user.getId()).orElse(user);
        }

        int currentStrikes = targetUser.getDuplicateStrikeCount();
        int nextStrike = currentStrikes + 1;
        targetUser.setDuplicateStrikeCount(nextStrike);

        if (nextStrike >= 2) {
            List<Contact> contacts = contactRepository.findByUser(targetUser);
            if (contacts != null && !contacts.isEmpty()) {
                contactRepository.deleteAll(contacts);
                contactRepository.flush();
            }
            userRepository.delete(targetUser);
            userRepository.flush();
            log.warn("User ID: {} permanently closed and deleted due to repeat duplicate phone violation", targetUser.getId());
            throw new DuplicatePhoneNumberException(
                    "Account Terminated: Repeated duplicate phone number violation (\"" + rawPhone + "\").",
                    2,
                    true,
                    rawPhone
            );
        } else {
            userRepository.saveAndFlush(targetUser);
            log.warn("User ID: {} received duplicate phone strike {}", targetUser.getId(), nextStrike);
            throw new DuplicatePhoneNumberException(
                    "Warning (1/2): Duplicate phone number \"" + rawPhone + "\" is strictly prohibited.",
                    1,
                    false,
                    rawPhone
            );
        }
    }
}
