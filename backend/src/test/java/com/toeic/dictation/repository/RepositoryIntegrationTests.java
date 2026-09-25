package com.toeic.dictation.repository;

import com.toeic.dictation.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class RepositoryIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ToeicTestRepository toeicTestRepository;

    @Autowired
    private AudioItemRepository audioItemRepository;

    @Autowired
    private AudioSegmentRepository audioSegmentRepository;

    @Autowired
    private StudyHistoryRepository studyHistoryRepository;

    @Test
    @DisplayName("Should query existing seed demo user")
    void testQueryUser() {
        Optional<User> demoUser = userRepository.findByUsername("demo_user");
        assertTrue(demoUser.isPresent(), "demo_user should exist in database");
        assertEquals("demo@example.com", demoUser.get().getEmail());
        assertEquals("ROLE_USER", demoUser.get().getRole());
        assertTrue(userRepository.existsByUsername("demo_user"));
        assertTrue(userRepository.existsByEmail("demo@example.com"));
        assertFalse(userRepository.existsByUsername("non_existing_user"));
    }

    @Test
    @DisplayName("Should query TOEIC tests and their audio items")
    void testQueryTestsAndItems() {
        List<ToeicTest> tests = toeicTestRepository.findAllByOrderByYearDescTestNumberAsc();
        assertFalse(tests.isEmpty(), "Should have at least 1 test");

        ToeicTest test1 = tests.get(0);
        assertEquals("ETS 2024 - Test 1", test1.getTitle());

        List<AudioItem> items = audioItemRepository.findByTestIdOrderByPartAscItemNumberAsc(test1.getId());
        assertEquals(2, items.size(), "Should have 2 items (Part 3 & Part 4)");

        AudioItem part3Item = items.get(0);
        assertEquals(3, part3Item.getPart());
        assertEquals("32-34", part3Item.getItemNumber());

        List<AudioSegment> segments = audioSegmentRepository.findByItemIdOrderBySegmentIndexAsc(part3Item.getId());
        assertEquals(7, segments.size(), "Part 3 item should have 7 segments");
        assertNotNull(segments.get(0).getFullTranscript());
        assertNotNull(segments.get(0).getTokensJson());
    }

    @Test
    @DisplayName("Should fetch audio item with segments eagerly")
    void testFindByIdWithSegments() {
        Optional<AudioItem> itemOpt = audioItemRepository.findByIdWithSegments(1L);
        assertTrue(itemOpt.isPresent());
        assertEquals(7, itemOpt.get().getSegments().size());
    }

    @Test
    @DisplayName("Should save and query study history")
    void testStudyHistoryOperations() {
        User user = userRepository.findByUsername("demo_user").orElseThrow();
        AudioItem item = audioItemRepository.findById(1L).orElseThrow();

        StudyHistory history = StudyHistory.builder()
                .user(user)
                .item(item)
                .mode("MEDIUM")
                .accuracyRate(java.math.BigDecimal.valueOf(88.50))
                .replaysCount(2)
                .wrongSegmentsCount(1)
                .detailsJson("{\"summary\": \"Great job\"}")
                .build();

        StudyHistory saved = studyHistoryRepository.save(history);
        assertNotNull(saved.getId());

        List<StudyHistory> userHistories = studyHistoryRepository.findByUserIdOrderByCompletedAtDesc(user.getId());
        assertFalse(userHistories.isEmpty());
        assertEquals("MEDIUM", userHistories.get(0).getMode());
    }
}
