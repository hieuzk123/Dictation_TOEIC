package com.toeic.dictation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.auth.LoginRequest;
import com.toeic.dictation.dto.study.SegmentAnswerDto;
import com.toeic.dictation.dto.study.SubmitStudyRequest;
import com.toeic.dictation.dto.study.WordAnswerDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class StudyControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String authToken;

    @BeforeEach
    void setUp() throws Exception {
        LoginRequest loginReq = new LoginRequest("demo_user", "password123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        this.authToken = objectMapper.readTree(body).get("token").asText();
    }

    @Test
    @DisplayName("Should reject submission without authentication token")
    void testSubmitUnauthorizedWithoutToken() throws Exception {
        SubmitStudyRequest request = SubmitStudyRequest.builder()
                .itemId(1L)
                .mode("MEDIUM")
                .build();

        mockMvc.perform(post("/api/study/submit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should submit study in MEDIUM cloze mode and receive accuracy feedback")
    void testSubmitStudyClozeMode() throws Exception {
        SegmentAnswerDto seg1 = SegmentAnswerDto.builder()
                .segmentId(1L)
                .wordAnswers(List.of(
                        WordAnswerDto.builder().wordIndex(0).targetWord("Mark").userWord("Mark").build(), // correct
                        WordAnswerDto.builder().wordIndex(7).targetWord("order").userWord("order").build(), // correct
                        WordAnswerDto.builder().wordIndex(10).targetWord("toner").userWord("toner").build(), // correct
                        WordAnswerDto.builder().wordIndex(11).targetWord("cartridges").userWord("wrongword").build() // wrong
                ))
                .build();

        SubmitStudyRequest req = SubmitStudyRequest.builder()
                .itemId(1L)
                .mode("MEDIUM")
                .replaysCount(3)
                .answers(List.of(seg1))
                .build();

        mockMvc.perform(post("/api/study/submit")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historyId", notNullValue()))
                .andExpect(jsonPath("$.itemId").value(1))
                .andExpect(jsonPath("$.mode").value("MEDIUM"))
                .andExpect(jsonPath("$.replaysCount").value(3))
                .andExpect(jsonPath("$.segmentResults", hasSize(7)))
                .andExpect(jsonPath("$.segmentResults[0].wordResults[0].isCorrect").value(true))
                .andExpect(jsonPath("$.segmentResults[0].wordResults[3].isCorrect").value(false));
    }

    @Test
    @DisplayName("Should fetch user study history after submitting")
    void testGetStudyHistory() throws Exception {
        // First submit an attempt
        SegmentAnswerDto seg = SegmentAnswerDto.builder()
                .segmentId(1L)
                .wordAnswers(List.of(
                        WordAnswerDto.builder().wordIndex(0).targetWord("Mark").userWord("Mark").build()
                ))
                .build();

        SubmitStudyRequest req = SubmitStudyRequest.builder()
                .itemId(1L)
                .mode("MEDIUM")
                .replaysCount(1)
                .answers(List.of(seg))
                .build();

        mockMvc.perform(post("/api/study/submit")
                .header("Authorization", "Bearer " + authToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Then get user history
        mockMvc.perform(get("/api/study/history")
                .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].itemTitle").value("Office Supply Toner Order"))
                .andExpect(jsonPath("$[0].part").value(3));
    }
}
