package com.contact_managment.main_application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the Contact Management System backend.
 * Serves as the primary entry point to initialize and start the Spring Boot application.
 */
@SpringBootApplication
public class MainApplication {

	/**
	 * Default constructor for MainApplication.
	 */
	public MainApplication() {
	}

	/**
	 * Main entry point for launching the Spring Boot application.
	 *
	 * @param args command-line arguments passed during application startup
	 */
	public static void main(String[] args) {
		SpringApplication.run(MainApplication.class, args);
	}

}


