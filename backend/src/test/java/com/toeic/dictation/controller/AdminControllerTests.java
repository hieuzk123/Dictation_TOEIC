package com.toeic.dictation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.auth.AuthResponse;
import com.toeic.dictation.dto.auth.LoginRequest;
import com.toeic.dictation.model.ToeicTest;
import com.toeic.dictation.repository.ToeicTestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("default")
class AdminControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ToeicTestRepository testRepository;

    private String userToken;
    private String adminToken;
    private Long testId;

    @BeforeEach
    void setUp() throws Exception {
        // 1. Authenticate as regular user (demo_user)
        LoginRequest userLogin = new LoginRequest("demo_user", "ToeicDictation@2026!");
        MvcResult userResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userLogin)))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse userAuth = objectMapper.readValue(userResult.getResponse().getContentAsString(), AuthResponse.class);
        userToken = userAuth.getToken();

        // 2. Authenticate as admin
        LoginRequest adminLogin = new LoginRequest("admin", "ToeicDictation@2026!");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse adminAuth = objectMapper.readValue(adminResult.getResponse().getContentAsString(), AuthResponse.class);
        adminToken = adminAuth.getToken();

        // 3. Obtain testId
        ToeicTest test = testRepository.findAll().stream().findFirst().orElseThrow();
        testId = test.getId();
    }

    @Test
    @DisplayName("GET /api/admin/stats without authentication should return 401 Unauthorized")
    void testAdminStatsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/admin/stats with ROLE_USER should return 403 Forbidden")
    void testAdminStatsForbiddenForRegularUser() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/stats with ROLE_ADMIN should return 200 OK and system stats")
    void testAdminStatsSuccessForAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTests", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalAudioItems", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalUsers", greaterThanOrEqualTo(2)));
    }

    @Test
    @DisplayName("POST /api/admin/items/upload should create audio item with parsed segments and return 200 OK")
    void testAdminUploadAndThenDelete() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audioFile",
                "test_dialog.mp3",
                "audio/mpeg",
                "FAKE_AUDIO_BYTES_FOR_UNIT_TEST".getBytes()
        );

        String sampleTranscript = "Good morning everyone. Welcome to our quarterly business review conference! Are we ready to begin?";

        MvcResult uploadResult = mockMvc.perform(multipart("/api/admin/items/upload")
                        .file(audioFile)
                        .param("testId", testId.toString())
                        .param("part", "3")
                        .param("itemNumber", "99-100")
                        .param("title", "Quarterly Business Review Upload Test")
                        .param("transcriptText", sampleTranscript)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").isNumber())
                .andExpect(jsonPath("$.title").value("Quarterly Business Review Upload Test"))
                .andExpect(jsonPath("$.totalSegments").value(3))
                .andReturn();

        // Extract itemId to test deletion
        String responseBody = uploadResult.getResponse().getContentAsString();
        long createdItemId = objectMapper.readTree(responseBody).get("itemId").asLong();

        // Now test deleting the item
        mockMvc.perform(delete("/api/admin/items/" + createdItemId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("AudioItem deleted successfully"))
                .andExpect(jsonPath("$.id").value(String.valueOf(createdItemId)));
    }

    @Test
    @DisplayName("POST /api/admin/tests should create a new test and return 201 Created")
    void testAdminCreateTestSuccess() throws Exception {
        com.toeic.dictation.dto.CreateTestRequest request = com.toeic.dictation.dto.CreateTestRequest.builder()
                .year("ETS 2023")
                .testNumber(2)
                .title("ETS 2023 - Test 2")
                .description("ETS Official Practice Test 2 (2023)")
                .build();

        mockMvc.perform(post("/api/admin/tests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.year").value("ETS 2023"))
                .andExpect(jsonPath("$.testNumber").value(2))
                .andExpect(jsonPath("$.title").value("ETS 2023 - Test 2"));
    }

    @Test
    @DisplayName("POST /api/admin/items/upload with newTestYear & newTestNumber should auto-create test")
    void testAdminUploadWithDynamicNewTest() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audioFile",
                "test_dynamic.mp3",
                "audio/mpeg",
                "FAKE_AUDIO_BYTES_DYNAMIC".getBytes()
        );

        MvcResult result = mockMvc.perform(multipart("/api/admin/items/upload")
                        .file(audioFile)
                        .param("newTestYear", "2022")
                        .param("newTestNumber", "5")
                        .param("newTestTitle", "ETS 2022 - Test 5")
                        .param("part", "4")
                        .param("itemNumber", "71-73")
                        .param("title", "Flight Delay Announcement 2022")
                        .param("transcriptText", "Attention all passengers. Flight 202 is delayed.")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").isNumber())
                .andExpect(jsonPath("$.title").value("Flight Delay Announcement 2022"))
                .andReturn();

        long createdItemId = objectMapper.readTree(result.getResponse().getContentAsString()).get("itemId").asLong();
        mockMvc.perform(delete("/api/admin/items/" + createdItemId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}

