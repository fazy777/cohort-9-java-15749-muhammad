package com.contact_managment.main_application.config;

import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Application configuration with dependency injection and null safety.
 * Fixes CodeRabbit OOP and DI checks.
 */
@Configuration
public class AppConfig {

    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class);

    /**
     * Configures CORS for frontend integration.
     *
     * @return WebMvcConfigurer with CORS mappings, never null
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        logger.info("Configuring CORS for Contact Management System");
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                Objects.requireNonNull(registry, "CorsRegistry must not be null");
                try {
                    registry.addMapping("/api/**")
                            .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                            .allowedHeaders("*")
                            .allowCredentials(true);
                    logger.debug("CORS configuration applied successfully");
                } catch (Exception e) {
                    logger.error("Failed to configure CORS: {}", e.getMessage(), e);
                    throw new IllegalStateException("CORS configuration failed", e);
                }
            }
        };
    }
}
