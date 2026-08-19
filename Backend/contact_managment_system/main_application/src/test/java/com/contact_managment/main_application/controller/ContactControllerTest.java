package com.contact_managment.main_application.controller;

import com.contact_managment.main_application.dto.*;
import com.contact_managment.main_application.security.JwtAuthenticationFilter;
import com.contact_managment.main_application.security.JwtTokenProvider;
import com.contact_managment.main_application.security.UserPrincipal;
import com.contact_managment.main_application.service.ContactService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContactController.class)
@AutoConfigureMockMvc(addFilters = false)
class ContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContactService contactService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ObjectMapper objectMapper;

    private UserPrincipal userPrincipal;
    private ContactDto contactDto;

    @BeforeEach
    void setUp() {
        userPrincipal = new UserPrincipal(1L, "John", "Doe", "john@example.com", "+123456", 1L, "pass", Collections.emptyList());
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        contactDto = ContactDto.builder()
                .id(10L)
                .firstName("Alice")
                .lastName("Wonderland")
                .title("Software Engineer")
                .build();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/contacts should return paginated list of contacts")
    void getContacts_Returns200() throws Exception {
        PagedResponse<ContactDto> pagedResponse = PagedResponse.<ContactDto>builder()
                .content(List.of(contactDto))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(contactService.getContacts(eq(1L), any(), eq(0), eq(10), eq("firstName"), eq("asc"))).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/contacts")
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].firstName").value("Alice"));
    }

    @Test
    @DisplayName("POST /api/contacts should create contact")
    void createContact_Returns201() throws Exception {
        when(contactService.createContact(eq(1L), any(ContactDto.class))).thenReturn(contactDto);

        mockMvc.perform(post("/api/contacts")
                        .with(csrf())
                        .with(user(userPrincipal))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(contactDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("Alice"));
    }

    @Test
    @DisplayName("DELETE /api/contacts/{id} should delete contact")
    void deleteContact_Returns200() throws Exception {
        doNothing().when(contactService).deleteContact(1L, 10L);

        mockMvc.perform(delete("/api/contacts/10")
                        .with(csrf())
                        .with(user(userPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Contact deleted successfully"));
    }
}
