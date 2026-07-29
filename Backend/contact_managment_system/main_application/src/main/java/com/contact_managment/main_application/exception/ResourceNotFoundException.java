package com.contact_managment.main_application.exception;

/**
 * Custom exception thrown when a requested resource cannot be found.
 * Implements proper OOP exception hierarchy for domain-specific errors.
 */
public class ResourceNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String resourceName;
    private final String fieldName;
    private final transient Object fieldValue;

    /**
     * Constructs exception with resource details.
     *
     * @param resourceName name of the resource type (e.g., "Contact")
     * @param fieldName    name of the field used for lookup (e.g., "id")
     * @param fieldValue   value of the field, must not be null
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", 
            validateNotNull(resourceName, "resourceName"),
            validateNotNull(fieldName, "fieldName"),
            validateNotNull(fieldValue, "fieldValue")));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    /**
     * Validates that an object is not null, throwing IllegalArgumentException if it is.
     *
     * @param obj       object to validate
     * @param paramName parameter name for error message
     * @param <T>       type of object
     * @return the validated object
     */
    private static <T> T validateNotNull(T obj, String paramName) {
        if (obj == null) {
            throw new IllegalArgumentException(paramName + " must not be null");
        }
        return obj;
    }

    public String getResourceName() {
        return resourceName;
    }

    public String getFieldName() {
        return fieldName;
    }

    public Object getFieldValue() {
        return fieldValue;
    }
}
