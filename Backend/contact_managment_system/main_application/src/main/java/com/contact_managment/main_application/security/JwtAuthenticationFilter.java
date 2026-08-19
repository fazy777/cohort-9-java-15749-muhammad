package com.contact_managment.main_application.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                Claims claims = tokenProvider.getClaimsFromJWT(jwt);
                if (claims != null && claims.getSubject() != null) {
                    Long userId;
                    try {
                        userId = Long.parseLong(claims.getSubject());
                    } catch (NumberFormatException nfe) {
                        log.debug("Invalid subject in JWT: {}", claims.getSubject());
                        filterChain.doFilter(request, response);
                        return;
                    }

                    Number versionNum = claims.get("tokenVersion", Number.class);
                    Long tokenVersionInJwt = versionNum != null ? versionNum.longValue() : null;

                    UserDetails userDetails;
                    try {
                        userDetails = customUserDetailsService.loadUserById(userId);
                    } catch (com.contact_managment.main_application.exception.ResourceNotFoundException | UsernameNotFoundException ex) {
                        log.debug("User not found for token subject ID {}: {}", userId, ex.getMessage());
                        filterChain.doFilter(request, response);
                        return;
                    }

                    if (userDetails instanceof UserPrincipal principal) {
                        if (tokenVersionInJwt == null || principal.getTokenVersion() == null
                                || !tokenVersionInJwt.equals(principal.getTokenVersion())) {
                            log.debug("Rejecting expired/revoked JWT token for user ID: {} due to token version mismatch or missing version", userId);
                            filterChain.doFilter(request, response);
                            return;
                        }
                    }

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Expected token validation exception: {}", ex.getMessage());
        } catch (RuntimeException ex) {
            log.warn("Unexpected error setting user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

