package com.toeic.dictation.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class DictationScoringService {

    /**
     * Normalizes a word by trimming, lowercasing, and stripping punctuation characters.
     * e.g. "Mark," -> "mark", "don't" -> "dont", "fourth-floor" -> "fourthfloor", "printer?" -> "printer"
     */
    public String normalizeWord(String word) {
        if (word == null) {
            return "";
        }
        return word.trim()
                .toLowerCase()
                .replaceAll("[^a-zA-Z0-9]", "");
    }

    /**
     * Checks if a user-submitted word matches the target word.
     */
    public boolean isWordMatch(String userWord, String targetWord) {
        String normUser = normalizeWord(userWord);
        String normTarget = normalizeWord(targetWord);
        return !normTarget.isEmpty() && normUser.equals(normTarget);
    }

    /**
     * Calculates the accuracy percentage formatted to 2 decimal places.
     */
    public BigDecimal calculateAccuracy(int correctWords, int totalWords) {
        if (totalWords <= 0) {
            return BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        }
        double percentage = ((double) correctWords / totalWords) * 100.0;
        return BigDecimal.valueOf(percentage).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Splits full sentence into normalized token array.
     */
    public List<String> tokenizeAndNormalize(String text) {
        List<String> result = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return result;
        }

        String[] tokens = text.trim().split("\\s+");
        for (String token : tokens) {
            String norm = normalizeWord(token);
            if (!norm.isEmpty()) {
                result.add(norm);
            }
        }
        return result;
    }
}
