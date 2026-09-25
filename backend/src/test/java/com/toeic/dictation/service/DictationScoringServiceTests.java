package com.toeic.dictation.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class DictationScoringServiceTests {

    private final DictationScoringService scoringService = new DictationScoringService();

    @Test
    @DisplayName("Should strip punctuation and lowercase words properly")
    void testNormalizeWord() {
        assertEquals("mark", scoringService.normalizeWord("Mark,"));
        assertEquals("dont", scoringService.normalizeWord("don't"));
        assertEquals("fourthfloor", scoringService.normalizeWord("fourth-floor"));
        assertEquals("printer", scoringService.normalizeWord("printer?"));
        assertEquals("toner", scoringService.normalizeWord("\"toner\"!"));
        assertEquals("", scoringService.normalizeWord("..."));
        assertEquals("", scoringService.normalizeWord(null));
    }

    @Test
    @DisplayName("Should match words correctly regardless of case or punctuation")
    void testIsWordMatch() {
        assertTrue(scoringService.isWordMatch("mark", "Mark,"));
        assertTrue(scoringService.isWordMatch("DONT", "don't"));
        assertTrue(scoringService.isWordMatch("toner", "Toner"));
        assertFalse(scoringService.isWordMatch("toners", "toner"));
        assertFalse(scoringService.isWordMatch("print", "printer"));
    }

    @Test
    @DisplayName("Should calculate accuracy rate correctly")
    void testCalculateAccuracy() {
        assertEquals(new BigDecimal("100.00"), scoringService.calculateAccuracy(10, 10));
        assertEquals(new BigDecimal("80.00"), scoringService.calculateAccuracy(8, 10));
        assertEquals(new BigDecimal("66.67"), scoringService.calculateAccuracy(2, 3));
        assertEquals(new BigDecimal("0.00"), scoringService.calculateAccuracy(0, 5));
        assertEquals(new BigDecimal("100.00"), scoringService.calculateAccuracy(0, 0));
    }

    @Test
    @DisplayName("Should tokenize and normalize text sentences")
    void testTokenizeAndNormalize() {
        List<String> tokens = scoringService.tokenizeAndNormalize("We're almost out of black ink.");
        assertEquals(List.of("were", "almost", "out", "of", "black", "ink"), tokens);
    }
}
