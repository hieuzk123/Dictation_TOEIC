package com.toeic.dictation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.auth.LoginRequest;
import com.toeic.dictation.dto.auth.RegisterRequest;
import com.toeic.dictation.dto.study.SegmentAnswerDto;
import com.toeic.dictation.dto.study.SubmitStudyRequest;
import com.toeic.dictation.dto.study.WordAnswerDto;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class EndToEndApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Complete E2E Journey: Register -> Login -> Browse Tests -> Fetch Item -> Stream Audio -> Submit Dictation -> Check History")
    void testCompleteStudentJourney() throws Exception {
        // Step 1: Register a new student
        RegisterRequest registerReq = RegisterRequest.builder()
                .username("e2e_student")
                .email("e2e_student@toeic.com")
                .password("mypassword123")
                .fullName("E2E Student")
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("e2e_student"));

        // Step 2: Login to obtain JWT token
        LoginRequest loginReq = new LoginRequest("e2e_student", "mypassword123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();
        assertNotNull(token);
        String authHeader = "Bearer " + token;

        // Step 3: Check authenticated profile
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("e2e_student"))
                .andExpect(jsonPath("$.fullName").value("E2E Student"));

        // Step 4: Browse list of TOEIC tests
        MvcResult testsResult = mockMvc.perform(get("/api/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andReturn();

        JsonNode testsJson = objectMapper.readTree(testsResult.getResponse().getContentAsString());
        long testId = testsJson.get(0).get("id").asLong();

        // Step 5: Browse items for the test
        MvcResult itemsResult = mockMvc.perform(get("/api/tests/" + testId + "/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andReturn();

        JsonNode itemsJson = objectMapper.readTree(itemsResult.getResponse().getContentAsString());
        long itemId = itemsJson.get(0).get("id").asLong();

        // Step 6: Fetch item detail with segments and tokens
        MvcResult itemDetailResult = mockMvc.perform(get("/api/items/" + itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.segments", hasSize(greaterThan(0))))
                .andReturn();

        JsonNode itemDetailJson = objectMapper.readTree(itemDetailResult.getResponse().getContentAsString());
        long segment1Id = itemDetailJson.get("segments").get(0).get("id").asLong();

        // Step 7: Stream audio file
        mockMvc.perform(get("/audio/ets2024_test1_part3_q32_34.mp3"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("audio")));

        // Step 8: Submit study answers (Cloze mode)
        SegmentAnswerDto segAnswer = SegmentAnswerDto.builder()
                .segmentId(segment1Id)
                .wordAnswers(List.of(
                        WordAnswerDto.builder().wordIndex(0).targetWord("Mark").userWord("mark").build(),
                        WordAnswerDto.builder().wordIndex(1).targetWord("did").userWord("did").build()
                ))
                .build();

        SubmitStudyRequest studyReq = SubmitStudyRequest.builder()
                .itemId(itemId)
                .mode("MEDIUM")
                .replaysCount(2)
                .answers(List.of(segAnswer))
                .build();

        MvcResult submitResult = mockMvc.perform(post("/api/study/submit")
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(studyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historyId", notNullValue()))
                .andExpect(jsonPath("$.accuracyRate", notNullValue()))
                .andExpect(jsonPath("$.segmentResults", hasSize(greaterThan(0))))
                .andReturn();

        long historyId = objectMapper.readTree(submitResult.getResponse().getContentAsString()).get("historyId").asLong();

        // Step 9: Verify study history list for student
        mockMvc.perform(get("/api/study/history")
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(historyId))
                .andExpect(jsonPath("$[0].mode").value("MEDIUM"))
                .andExpect(jsonPath("$[0].replaysCount").value(2));

        // Step 10: Verify study history detail
        mockMvc.perform(get("/api/study/history/" + historyId)
                .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(historyId))
                .andExpect(jsonPath("$.mode").value("MEDIUM"))
                .andExpect(jsonPath("$.detailsJson", notNullValue()));
    }
}
