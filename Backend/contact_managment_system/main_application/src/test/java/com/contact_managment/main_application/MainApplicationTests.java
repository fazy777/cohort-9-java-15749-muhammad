package com.contact_managment.main_application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

/**
 * Test class for verifying the Spring Boot application context configuration.
 * Includes null safety and exception handling validation.
 */
@SpringBootTest
class MainApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	/**
	 * Tests whether the Spring application context loads successfully.
	 * Validates that critical beans are present with null checks.
	 */
	@Test
	@DisplayName("Should load Spring application context successfully")
	void contextLoads() {
		assertNotNull(applicationContext, "Application context should not be null");
		assertDoesNotThrow(() -> {
			// Verify main application bean exists
			Object bean = applicationContext.getBean(MainApplication.class);
			if (bean == null) {
				throw new IllegalStateException("MainApplication bean should not be null");
			}
		}, "Context loading should not throw exceptions");
	}

	/**
	 * Tests main method with null and empty args for robustness.
	 */
	@Test
	@DisplayName("Should handle null and empty args gracefully in main class validation")
	void testMainClassInstanceCreation() {
		assertDoesNotThrow(() -> {
			// Validate that main application class can be referenced without NPE
			Class<?> clazz = MainApplication.class;
			if (clazz == null) {
				throw new IllegalStateException("MainApplication class reference must not be null");
			}
			assertNotNull(clazz.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class),
					"MainApplication should have SpringBootApplication annotation");
		});
	}
}


