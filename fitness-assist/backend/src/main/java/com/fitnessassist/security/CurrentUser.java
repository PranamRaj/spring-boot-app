package com.fitnessassist.security;

import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.User;
import com.fitnessassist.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Resolves the logged-in user entity from the JWT-authenticated security context. */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository users;

    public User get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
