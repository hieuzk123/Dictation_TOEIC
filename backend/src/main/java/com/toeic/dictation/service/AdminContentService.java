package com.toeic.dictation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.AdminStatsResponse;
import com.toeic.dictation.dto.AdminUploadResponse;
import com.toeic.dictation.model.AudioItem;
import com.toeic.dictation.model.AudioSegment;
import com.toeic.dictation.model.ToeicTest;
import com.toeic.dictation.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminContentService {

    private final ToeicTestRepository testRepository;
    private final AudioItemRepository itemRepository;
    private final AudioSegmentRepository segmentRepository;
    private final UserRepository userRepository;
    private final StudyHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.audio-dir:../data_pipeline/sample_data/}")
    private String audioDir;

    private static final Set<String> STOPWORDS = new HashSet<>(Arrays.asList(
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "from",
            "up", "about", "into", "through", "after", "over", "between", "out", "against", "during",
            "without", "before", "under", "around", "among", "is", "am", "are", "was", "were", "be",
            "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "shall",
            "should", "will", "would", "may", "might", "must", "i", "you", "he", "she", "it", "we",
            "they", "me", "him", "her", "us", "them", "my", "your", "his", "their", "our", "this",
            "that", "these", "those"
    ));

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalTests(testRepository.count())
                .totalAudioItems(itemRepository.count())
                .totalSegments(segmentRepository.count())
                .totalUsers(userRepository.count())
                .totalStudySessions(historyRepository.count())
                .build();
    }

    @Transactional
    public void deleteAudioItem(Long id) {
        AudioItem item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("AudioItem not found with id: " + id));
        itemRepository.delete(item);
        log.info("Deleted AudioItem id: {} and associated segments", id);
    }

    @Transactional
    public AdminUploadResponse uploadAndCreateItem(
            Long testId,
            Integer part,
            String itemNumber,
            String title,
            MultipartFile audioFile,
            String transcriptText
    ) throws IOException {
        if (testId == null) throw new IllegalArgumentException("testId is required");
        if (part == null || (part != 3 && part != 4)) throw new IllegalArgumentException("part must be 3 or 4");
        if (itemNumber == null || itemNumber.trim().isEmpty()) throw new IllegalArgumentException("itemNumber is required");
        if (title == null || title.trim().isEmpty()) throw new IllegalArgumentException("title is required");
        if (audioFile == null || audioFile.isEmpty()) throw new IllegalArgumentException("audioFile is required");

        ToeicTest test = testRepository.findById(testId)
                .orElseThrow(() -> new IllegalArgumentException("ToeicTest not found with id: " + testId));

        // 1. Save Audio File to audioDir
        Path audioPath = Paths.get(audioDir).toAbsolutePath().normalize();
        if (!Files.exists(audioPath)) {
            Files.createDirectories(audioPath);
        }

        String safeItemNum = itemNumber.replaceAll("[^a-zA-Z0-9_-]", "_");
        String originalFilename = audioFile.getOriginalFilename();
        String extension = ".mp3";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = "upload_test" + testId + "_part" + part + "_q" + safeItemNum + "_" + System.currentTimeMillis() + extension;
        Path targetFilePath = audioPath.resolve(fileName);
        Files.copy(audioFile.getInputStream(), targetFilePath, StandardCopyOption.REPLACE_EXISTING);

        String audioUrl = "/audio/" + fileName;

        // 2. Parse Transcript & Segment
        List<String> rawSentences = new ArrayList<>();
        if (transcriptText != null && !transcriptText.trim().isEmpty()) {
            String[] split = transcriptText.split("(?<=[.?!])\\s+|\\r?\\n+");
            for (String s : split) {
                String trimmed = s.trim();
                if (!trimmed.isEmpty()) {
                    rawSentences.add(trimmed);
                }
            }
        }
        if (rawSentences.isEmpty()) {
            rawSentences.add("Listening practice for question " + itemNumber + ".");
        }

        double currentTime = 0.0;
        double segmentDuration = 4.5; // default estimated duration per sentence

        List<AudioSegment> segments = new ArrayList<>();
        int segIndex = 1;

        for (String sentence : rawSentences) {
            String[] tokens = sentence.split("\\s+");
            List<Map<String, Object>> tokenList = new ArrayList<>();
            int keywordCount = 0;

            double tokenDuration = tokens.length > 0 ? (segmentDuration / tokens.length) : 0.3;
            double tokenStart = currentTime;

            for (String rawToken : tokens) {
                String cleanWord = rawToken.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                boolean isKeyword = cleanWord.length() > 2 && !STOPWORDS.contains(cleanWord);
                if (isKeyword) keywordCount++;

                double tokenEnd = Math.round((tokenStart + tokenDuration) * 100.0) / 100.0;
                Map<String, Object> tokenObj = new HashMap<>();
                tokenObj.put("raw", rawToken);
                tokenObj.put("word", cleanWord);
                tokenObj.put("start_time", Math.round(tokenStart * 100.0) / 100.0);
                tokenObj.put("end_time", tokenEnd);
                tokenObj.put("is_keyword", isKeyword);
                tokenList.add(tokenObj);

                tokenStart = tokenEnd;
            }

            double segEndTime = Math.round((currentTime + segmentDuration) * 100.0) / 100.0;

            String tokensJson = objectMapper.writeValueAsString(tokenList);

            AudioSegment segment = AudioSegment.builder()
                    .segmentIndex(segIndex++)
                    .startTime(BigDecimal.valueOf(Math.round(currentTime * 100.0) / 100.0))
                    .endTime(BigDecimal.valueOf(segEndTime))
                    .fullTranscript(sentence)
                    .totalWords(tokens.length)
                    .keywordCount(keywordCount)
                    .tokensJson(tokensJson)
                    .build();

            segments.add(segment);
            currentTime = segEndTime;
        }

        double totalDuration = Math.round(currentTime * 100.0) / 100.0;

        // 3. Create and Save AudioItem
        AudioItem item = AudioItem.builder()
                .test(test)
                .part(part)
                .itemNumber(itemNumber)
                .title(title)
                .audioUrl(audioUrl)
                .totalDuration(BigDecimal.valueOf(totalDuration))
                .totalSegments(segments.size())
                .segments(new ArrayList<>())
                .build();

        AudioItem savedItem = itemRepository.save(item);

        for (AudioSegment seg : segments) {
            seg.setItem(savedItem);
            savedItem.getSegments().add(seg);
        }
        segmentRepository.saveAll(segments);

        log.info("Created AudioItem id: {}, segments: {}, audioUrl: {}", savedItem.getId(), segments.size(), audioUrl);

        return AdminUploadResponse.builder()
                .itemId(savedItem.getId())
                .title(savedItem.getTitle())
                .audioUrl(savedItem.getAudioUrl())
                .totalSegments(savedItem.getTotalSegments())
                .message("Successfully created AudioItem with " + segments.size() + " segments.")
                .build();
    }
}
