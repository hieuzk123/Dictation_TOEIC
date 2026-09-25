package com.toeic.dictation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.auth.LoginRequest;
import com.toeic.dictation.dto.auth.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully login with seed demo user")
    void testLoginDemoUser() throws Exception {
        LoginRequest req = new LoginRequest("demo_user", "ToeicDictation@2026!");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("demo_user"))
                .andExpect(jsonPath("$.email").value("demo@example.com"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
    }

    @Test
    @DisplayName("Should reject login with wrong password")
    void testLoginWrongPassword() throws Exception {
        LoginRequest req = new LoginRequest("demo_user", "wrongpassword");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should register new user and return token")
    void testRegisterNewUser() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .username("new_student_99")
                .email("student99@test.com")
                .password("securePassword123")
                .fullName("New Student")
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("new_student_99"))
                .andExpect(jsonPath("$.email").value("student99@test.com"));
    }

    @Test
    @DisplayName("Should reject registration with duplicate username")
    void testRegisterDuplicateUsername() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .username("demo_user")
                .email("different_email@test.com")
                .password("password123")
                .fullName("Duplicate User")
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should get user profile with valid Bearer token")
    void testGetProfileWithToken() throws Exception {
        // 1. Login to get token
        LoginRequest loginReq = new LoginRequest("demo_user", "ToeicDictation@2026!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).get("token").asText();

        // 2. Access /api/auth/me with Bearer token
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo_user"))
                .andExpect(jsonPath("$.email").value("demo@example.com"));
    }

    @Test
    @DisplayName("Should reject /api/auth/me without token")
    void testGetProfileWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should successfully refresh token with valid refresh token")
    void testRefreshTokenSuccess() throws Exception {
        LoginRequest loginReq = new LoginRequest("demo_user", "ToeicDictation@2026!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isString())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(responseBody).get("refreshToken").asText();

        // Refresh tokens
        com.toeic.dictation.dto.auth.RefreshTokenRequest refreshReq = 
                new com.toeic.dictation.dto.auth.RefreshTokenRequest(refreshToken);

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.refreshToken").isString())
                .andReturn();

        String newResponseBody = refreshResult.getResponse().getContentAsString();
        String newToken = objectMapper.readTree(newResponseBody).get("token").asText();

        // Verify new token works on protected endpoint
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo_user"));
    }

    @Test
    @DisplayName("Should reject refresh with invalid or forged token")
    void testRefreshTokenInvalid() throws Exception {
        com.toeic.dictation.dto.auth.RefreshTokenRequest refreshReq = 
                new com.toeic.dictation.dto.auth.RefreshTokenRequest("invalid.forged.jwt.token");

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should reject refresh when access token is provided instead of refresh token")
    void testRefreshTokenWithAccessTokenRejected() throws Exception {
        LoginRequest loginReq = new LoginRequest("demo_user", "ToeicDictation@2026!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseBody).get("token").asText();

        // Try to refresh using access token
        com.toeic.dictation.dto.auth.RefreshTokenRequest refreshReq = 
                new com.toeic.dictation.dto.auth.RefreshTokenRequest(accessToken);

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized());
    }
}
