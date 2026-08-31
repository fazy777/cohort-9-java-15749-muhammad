package com.contact_managment.main_application.dto;

import lombok.*;

/**
 * Generic API response envelope wrapping payload data, status flag, and message.
 *
 * @param <T> payload type
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    /**
     * Constructs a successful ApiResponse with message and payload.
     *
     * @param message success description
     * @param data response payload
     * @param <T> data type
     * @return ApiResponse instance
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Constructs a successful ApiResponse with message only.
     *
     * @param message success description
     * @param <T> data type
     * @return ApiResponse instance
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    /**
     * Constructs an error ApiResponse with an error message.
     *
     * @param message error description
     * @param <T> data type
     * @return ApiResponse instance
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}
