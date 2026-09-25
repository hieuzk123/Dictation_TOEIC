package com.toeic.dictation.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ToeicControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should return list of TOEIC tests with item counts")
    void testGetTests() throws Exception {
        mockMvc.perform(get("/api/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].title").value("ETS 2024 - Test 1"))
                .andExpect(jsonPath("$[0].itemCount").value(2));
    }

    @Test
    @DisplayName("Should return list of audio items for test 1")
    void testGetItemsByTest() throws Exception {
        mockMvc.perform(get("/api/tests/1/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].itemNumber").value("32-34"))
                .andExpect(jsonPath("$[1].itemNumber").value("71-73"));
    }

    @Test
    @DisplayName("Should filter audio items by part")
    void testGetItemsFilteredByPart() throws Exception {
        mockMvc.perform(get("/api/tests/1/items?part=3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].part").value(3))
                .andExpect(jsonPath("$[0].itemNumber").value("32-34"));
    }

    @Test
    @DisplayName("Should return detailed item with parsed segments and tokens")
    void testGetItemDetail() throws Exception {
        mockMvc.perform(get("/api/items/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Office Supply Toner Order"))
                .andExpect(jsonPath("$.totalSegments").value(7))
                .andExpect(jsonPath("$.segments", hasSize(7)))
                .andExpect(jsonPath("$.segments[0].segmentIndex").value(1))
                .andExpect(jsonPath("$.segments[0].fullTranscript", containsString("Mark, did you get a chance")))
                .andExpect(jsonPath("$.segments[0].tokens", notNullValue()))
                .andExpect(jsonPath("$.segments[0].tokens[0].word").value("Mark"))
                .andExpect(jsonPath("$.segments[0].tokens[0].is_keyword").value(true));
    }

    @Test
    @DisplayName("Should stream static audio mp3 file")
    void testStreamAudioFile() throws Exception {
        mockMvc.perform(get("/audio/ets2024_test1_part3_q32_34.mp3"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("audio")));
    }
}
