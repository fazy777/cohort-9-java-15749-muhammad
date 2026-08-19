package com.contact_managment.main_application.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility component responsible for generating, signing, parsing, and validating JWT authentication tokens.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationInMs;

    private SecretKey signingKey;

    /**
     * Initializes and caches the HMAC SHA signing key from the configured JWT secret.
     *
     * @throws IllegalStateException if secret is not set or less than 32 bytes
     */
    @PostConstruct
    public void init() {
        if (!StringUtils.hasText(jwtSecret) || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT secret is not configured or too short (minimum 256 bits / 32 characters required). " +
                    "Please set the JWT_SECRET environment variable or configure jwt.secret in application.properties."
            );
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Retrieves the cached signing key.
     *
     * @return the SecretKey instance
     */
    private SecretKey getSigningKey() {
        return this.signingKey;
    }

    /**
     * Generates a signed JWT token from an Authentication object.
     *
     * @param authentication the authenticated principal
     * @return serialized compact JWT string
     */
    public String generateToken(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            throw new BadCredentialsException("Authentication principal must be a valid UserPrincipal");
        }
        return generateToken(userPrincipal.getId(), userPrincipal.getTokenVersion());
    }

    /**
     * Generates a signed JWT token with the specified user ID and token version claim.
     *
     * @param userId user identifier stored in the subject claim
     * @param tokenVersion version number used to invalidate revoked tokens
     * @return compact JWT token string
     */
    public String generateToken(Long userId, Long tokenVersion) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(Long.toString(userId))
                .claim("tokenVersion", tokenVersion != null ? tokenVersion : 1L)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Parses and returns the claims payload from a signed JWT string.
     *
     * @param token compact JWT string
     * @return Claims payload if valid; null otherwise
     */
    public Claims getClaimsFromJWT(String token) {
        if (!StringUtils.hasText(token)) {
            return null;
        }
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Invalid or unparseable JWT token: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Extracts the user ID from the subject claim of a JWT token.
     *
     * @param token compact JWT string
     * @return user ID as Long, or null if unparseable
     */
    public Long getUserIdFromJWT(String token) {
        Claims claims = getClaimsFromJWT(token);
        if (claims == null || claims.getSubject() == null) {
            return null;
        }
        try {
            return Long.parseLong(claims.getSubject());
        } catch (NumberFormatException ex) {
            log.debug("Could not parse userId from JWT subject '{}': {}", claims.getSubject(), ex.getMessage());
            return null;
        }
    }

    /**
     * Extracts the tokenVersion claim from a JWT token.
     *
     * @param token compact JWT string
     * @return token version number as Long, or null if missing/invalid
     */
    public Long getTokenVersionFromJWT(String token) {
        Claims claims = getClaimsFromJWT(token);
        if (claims == null) {
            return null;
        }
        try {
            Number version = claims.get("tokenVersion", Number.class);
            return version != null ? version.longValue() : 1L;
        } catch (RequiredTypeException | IllegalArgumentException e) {
            log.debug("Could not extract tokenVersion from JWT: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Validates whether a given token is well-formed, signed with current secret, and unexpired.
     *
     * @param authToken compact JWT string
     * @return true if valid; false otherwise
     */
    public boolean validateToken(String authToken) {
        return getClaimsFromJWT(authToken) != null;
    }
}
