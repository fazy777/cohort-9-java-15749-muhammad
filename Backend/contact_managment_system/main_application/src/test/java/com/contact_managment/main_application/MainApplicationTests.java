package com.contact_managment.main_application;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Test class for verifying the Spring Boot application context configuration.
 */
@SpringBootTest
class MainApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	/**
	 * Tests whether the Spring application context loads successfully.
	 */
	@Test
	@DisplayName("Should successfully load Spring ApplicationContext without errors")
	void contextLoads() {
		assertNotNull(applicationContext, "ApplicationContext must not be null when initialized");
	}
}
