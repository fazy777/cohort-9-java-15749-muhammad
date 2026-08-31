package com.contact_managment.main_application.dto;

import lombok.*;
import java.util.List;

/**
 * Paginated data response wrapper containing items and pagination metadata.
 *
 * @param <T> element type
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
}
