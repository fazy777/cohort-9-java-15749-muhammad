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
	 * Main entry point for launching the Spring Boot application.
	 *
	 * @param args command-line arguments passed during application startup
	 */
	public static void main(String[] args) {
		String[] safeArgs = args != null ? args : new String[0];
		try {
			logger.info("Starting Contact Management System Application...");
			SpringApplication.run(MainApplication.class, safeArgs);
			logger.info("Contact Management System Application started successfully.");
		} catch (Exception ex) {
			logger.error("Failed to start Contact Management System Application: {}", ex.getMessage(), ex);
			throw ex;
		}
	}
}
