package com.toeic.dictation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.AdminStatsResponse;
import com.toeic.dictation.dto.AdminUploadResponse;
import com.toeic.dictation.dto.CreateTestRequest;
import com.toeic.dictation.dto.toeic.CreateQuestionRequest;
import com.toeic.dictation.dto.toeic.ToeicTestDto;
import com.toeic.dictation.model.AudioItem;
import com.toeic.dictation.model.AudioSegment;
import com.toeic.dictation.model.ToeicQuestion;
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
    private final ToeicQuestionRepository questionRepository;
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
    public ToeicTestDto createTest(CreateTestRequest request) {
        if (request.getYear() == null || request.getYear().trim().isEmpty()) {
            throw new IllegalArgumentException("Năm phát hành / Bộ đề không được để trống (vd: 2023 hoặc ETS 2023)");
        }
        if (request.getTestNumber() == null || request.getTestNumber() < 1) {
            throw new IllegalArgumentException("Số thứ tự đề thi phải lớn hơn 0");
        }

        String year = request.getYear().trim();
        Integer testNum = request.getTestNumber();

        Optional<ToeicTest> existing = testRepository.findByYearAndTestNumber(year, testNum);
        if (existing.isPresent()) {
            ToeicTest t = existing.get();
            return ToeicTestDto.builder()
                    .id(t.getId())
                    .year(t.getYear())
                    .testNumber(t.getTestNumber())
                    .title(t.getTitle())
                    .description(t.getDescription())
                    .itemCount(t.getItems() != null ? t.getItems().size() : 0)
                    .build();
        }

        String title = (request.getTitle() != null && !request.getTitle().trim().isEmpty())
                ? request.getTitle().trim()
                : (year.toUpperCase().startsWith("ETS") ? year : "ETS " + year) + " - Test " + testNum;

        ToeicTest newTest = ToeicTest.builder()
                .year(year)
                .testNumber(testNum)
                .title(title)
                .description(request.getDescription())
                .build();

        ToeicTest saved = testRepository.save(newTest);
        log.info("Created new ToeicTest: id={}, title={}", saved.getId(), saved.getTitle());

        return ToeicTestDto.builder()
                .id(saved.getId())
                .year(saved.getYear())
                .testNumber(saved.getTestNumber())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .itemCount(0)
                .build();
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
        return uploadAndCreateItem(testId, part, itemNumber, title, audioFile, transcriptText, null, null, null, null);
    }

    @Transactional
    public AdminUploadResponse uploadAndCreateItem(
            Long testId,
            Integer part,
            String itemNumber,
            String title,
            MultipartFile audioFile,
            String transcriptText,
            String newTestYear,
            Integer newTestNumber,
            String newTestTitle
    ) throws IOException {
        return uploadAndCreateItem(testId, part, itemNumber, title, audioFile, transcriptText, newTestYear, newTestNumber, newTestTitle, null);
    }

    @Transactional
    public AdminUploadResponse uploadAndCreateItem(
            Long testId,
            Integer part,
            String itemNumber,
            String title,
            MultipartFile audioFile,
            String transcriptText,
            String newTestYear,
            Integer newTestNumber,
            String newTestTitle,
            String questionsJson
    ) throws IOException {
        if (part == null || (part != 3 && part != 4)) throw new IllegalArgumentException("part must be 3 or 4");
        if (itemNumber == null || itemNumber.trim().isEmpty()) throw new IllegalArgumentException("itemNumber is required");
        if (title == null || title.trim().isEmpty()) throw new IllegalArgumentException("title is required");
        if (audioFile == null || audioFile.isEmpty()) throw new IllegalArgumentException("audioFile is required");

        ToeicTest test;
        if (testId != null) {
            test = testRepository.findById(testId)
                    .orElseThrow(() -> new IllegalArgumentException("ToeicTest not found with id: " + testId));
        } else if (newTestYear != null && !newTestYear.trim().isEmpty() && newTestNumber != null) {
            CreateTestRequest req = CreateTestRequest.builder()
                    .year(newTestYear.trim())
                    .testNumber(newTestNumber)
                    .title(newTestTitle)
                    .build();
            ToeicTestDto createdDto = createTest(req);
            test = testRepository.findById(createdDto.getId())
                    .orElseThrow(() -> new IllegalStateException("Failed to retrieve created test"));
        } else {
            throw new IllegalArgumentException("Vui lòng chọn hoặc tạo đề thi áp dụng.");
        }


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

        // 4. Save Questions if provided
        if (questionsJson != null && !questionsJson.trim().isEmpty()) {
            try {
                List<CreateQuestionRequest> questionRequests = objectMapper.readValue(
                        questionsJson,
                        new com.fasterxml.jackson.core.type.TypeReference<List<CreateQuestionRequest>>() {}
                );
                List<ToeicQuestion> questionsToSave = new ArrayList<>();
                for (CreateQuestionRequest qReq : questionRequests) {
                    questionsToSave.add(ToeicQuestion.builder()
                            .item(savedItem)
                            .questionNumber(qReq.getQuestionNumber())
                            .questionText(qReq.getQuestionText())
                            .optionA(qReq.getOptionA())
                            .optionB(qReq.getOptionB())
                            .optionC(qReq.getOptionC())
                            .optionD(qReq.getOptionD())
                            .correctOption(qReq.getCorrectOption() != null ? qReq.getCorrectOption().toUpperCase() : "A")
                            .explanation(qReq.getExplanation())
                            .build());
                }
                questionRepository.saveAll(questionsToSave);
                log.info("Saved {} questions for item id: {}", questionsToSave.size(), savedItem.getId());
            } catch (Exception e) {
                log.error("Failed to parse or save questionsJson: {}", questionsJson, e);
                throw new IllegalArgumentException("Định dạng câu hỏi trắc nghiệm không hợp lệ: " + e.getMessage());
            }
        }

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
