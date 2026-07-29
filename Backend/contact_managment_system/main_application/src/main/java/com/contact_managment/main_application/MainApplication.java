package com.contact_managment.main_application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the Contact Management System backend.
 * Serves as the primary entry point to initialize and start the Spring Boot application.
 */
@SpringBootApplication
public class MainApplication {

	private static final Logger logger = LoggerFactory.getLogger(MainApplication.class);

	/**
	 * Main entry point for launching the Spring Boot application with robust
	 * exception handling and null safety checks.
	 *
	 * @param args command-line arguments passed during application startup, may be null or empty
	 */
	public static void main(String[] args) {
		try {
			// Null safety: ensure args is never null
			String[] safeArgs = args != null ? args : new String[0];

			logger.info("Starting Contact Management System application with {} arguments", safeArgs.length);
			SpringApplication.run(MainApplication.class, safeArgs);
			logger.info("Contact Management System application started successfully");
		} catch (IllegalArgumentException e) {
			logger.error("Invalid arguments provided during application startup", e);
			throw e;
		} catch (Exception e) {
			logger.error("Failed to start Contact Management System application: {}", e.getMessage(), e);
			// Rethrow to ensure failure is visible to orchestrators (container, systemd)
			throw new IllegalStateException("Application startup failed", e);
		}
	}
}


