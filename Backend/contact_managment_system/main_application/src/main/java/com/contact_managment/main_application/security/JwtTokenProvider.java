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

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationInMs;

    @PostConstruct
    public void init() {
        if (!StringUtils.hasText(jwtSecret) || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT secret is not configured or too short (minimum 256 bits / 32 characters required). " +
                    "Please set the JWT_SECRET environment variable or configure jwt.secret in application.properties."
            );
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            throw new BadCredentialsException("Authentication principal must be a valid UserPrincipal");
        }
        return generateToken(userPrincipal.getId(), userPrincipal.getTokenVersion());
    }

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

    public String generateTokenFromUserId(Long userId) {
        return generateToken(userId, 1L);
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.parseLong(claims.getSubject());
    }

    public Long getTokenVersionFromJWT(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Number version = claims.get("tokenVersion", Number.class);
            return version != null ? version.longValue() : 1L;
        } catch (Exception e) {
            log.debug("Could not extract tokenVersion from JWT: {}", e.getMessage());
            return null;
        }
    }

    public boolean validateToken(String authToken) {
        if (!StringUtils.hasText(authToken)) {
            return false;
        }
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken);
            return true;
        } catch (JwtException ex) {
            log.debug("Invalid or expired JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.debug("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }
}
