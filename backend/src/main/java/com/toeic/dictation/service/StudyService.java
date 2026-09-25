package com.toeic.dictation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.study.*;
import com.toeic.dictation.model.AudioItem;
import com.toeic.dictation.model.AudioSegment;
import com.toeic.dictation.model.StudyHistory;
import com.toeic.dictation.model.User;
import com.toeic.dictation.repository.AudioItemRepository;
import com.toeic.dictation.repository.AudioSegmentRepository;
import com.toeic.dictation.repository.StudyHistoryRepository;
import com.toeic.dictation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyService {

    private final StudyHistoryRepository studyHistoryRepository;
    private final AudioItemRepository audioItemRepository;
    private final AudioSegmentRepository audioSegmentRepository;
    private final UserRepository userRepository;
    private final DictationScoringService scoringService;
    private final ObjectMapper objectMapper;

    @Transactional
    public SubmitStudyResponse submitStudy(String username, SubmitStudyRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        AudioItem item = audioItemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audio item not found"));

        List<AudioSegment> segments = audioSegmentRepository.findByItemIdOrderBySegmentIndexAsc(item.getId());

        Map<Long, SegmentAnswerDto> answerMap = request.getAnswers().stream()
                .filter(a -> a.getSegmentId() != null)
                .collect(Collectors.toMap(SegmentAnswerDto::getSegmentId, Function.identity(), (a, b) -> a));

        List<SegmentResultDto> segmentResults = new ArrayList<>();
        int grandTotalWords = 0;
        int grandCorrectWords = 0;
        int wrongSegmentsCount = 0;

        for (AudioSegment segment : segments) {
            SegmentAnswerDto ans = answerMap.get(segment.getId());

            List<WordResultDto> wordResults = new ArrayList<>();
            int segTotalWords = 0;
            int segCorrectWords = 0;

            if (ans != null && ans.getWordAnswers() != null && !ans.getWordAnswers().isEmpty()) {
                // Cloze test mode (word-by-word comparison)
                for (WordAnswerDto wordAns : ans.getWordAnswers()) {
                    boolean match = scoringService.isWordMatch(wordAns.getUserWord(), wordAns.getTargetWord());
                    segTotalWords++;
                    if (match) {
                        segCorrectWords++;
                    }
                    wordResults.add(WordResultDto.builder()
                            .wordIndex(wordAns.getWordIndex())
                            .targetWord(wordAns.getTargetWord())
                            .userWord(wordAns.getUserWord())
                            .isCorrect(match)
                            .build());
                }
            } else if (ans != null && ans.getUserTranscript() != null) {
                // Full sentence mode comparison
                List<String> targetTokens = scoringService.tokenizeAndNormalize(segment.getFullTranscript());
                List<String> userTokens = scoringService.tokenizeAndNormalize(ans.getUserTranscript());

                segTotalWords = targetTokens.size();
                for (int i = 0; i < targetTokens.size(); i++) {
                    String target = targetTokens.get(i);
                    String userWord = (i < userTokens.size()) ? userTokens.get(i) : "";
                    boolean match = target.equals(userWord);
                    if (match) {
                        segCorrectWords++;
                    }
                    wordResults.add(WordResultDto.builder()
                            .wordIndex(i)
                            .targetWord(target)
                            .userWord(userWord)
                            .isCorrect(match)
                            .build());
                }
            } else {
                // Not attempted
                List<String> targetTokens = scoringService.tokenizeAndNormalize(segment.getFullTranscript());
                segTotalWords = targetTokens.size();
                for (int i = 0; i < targetTokens.size(); i++) {
                    wordResults.add(WordResultDto.builder()
                            .wordIndex(i)
                            .targetWord(targetTokens.get(i))
                            .userWord("")
                            .isCorrect(false)
                            .build());
                }
            }

            boolean isPerfect = (segTotalWords > 0) && (segCorrectWords == segTotalWords);
            if (!isPerfect) {
                wrongSegmentsCount++;
            }

            grandTotalWords += segTotalWords;
            grandCorrectWords += segCorrectWords;

            segmentResults.add(SegmentResultDto.builder()
                    .segmentId(segment.getId())
                    .segmentIndex(segment.getSegmentIndex())
                    .isPerfect(isPerfect)
                    .totalWords(segTotalWords)
                    .correctWords(segCorrectWords)
                    .wordResults(wordResults)
                    .build());
        }

        BigDecimal accuracyRate = scoringService.calculateAccuracy(grandCorrectWords, grandTotalWords);

        String detailsJson = null;
        try {
            detailsJson = objectMapper.writeValueAsString(segmentResults);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize detailsJson", e);
        }

        StudyHistory history = StudyHistory.builder()
                .user(user)
                .item(item)
                .mode(request.getMode().toUpperCase())
                .accuracyRate(accuracyRate)
                .replaysCount(request.getReplaysCount() != null ? request.getReplaysCount() : 0)
                .wrongSegmentsCount(wrongSegmentsCount)
                .detailsJson(detailsJson)
                .build();

        StudyHistory savedHistory = studyHistoryRepository.save(history);

        return SubmitStudyResponse.builder()
                .historyId(savedHistory.getId())
                .itemId(item.getId())
                .mode(history.getMode())
                .accuracyRate(accuracyRate)
                .totalWords(grandTotalWords)
                .correctWords(grandCorrectWords)
                .wrongSegmentsCount(wrongSegmentsCount)
                .replaysCount(history.getReplaysCount())
                .segmentResults(segmentResults)
                .build();
    }

    @Transactional(readOnly = true)
    public List<StudyHistoryDto> getUserHistories(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<StudyHistory> histories = studyHistoryRepository.findByUserIdOrderByCompletedAtDesc(user.getId());

        return histories.stream().map(h -> StudyHistoryDto.builder()
                .id(h.getId())
                .itemId(h.getItem().getId())
                .itemTitle(h.getItem().getTitle())
                .part(h.getItem().getPart())
                .itemNumber(h.getItem().getItemNumber())
                .mode(h.getMode())
                .accuracyRate(h.getAccuracyRate())
                .replaysCount(h.getReplaysCount())
                .wrongSegmentsCount(h.getWrongSegmentsCount())
                .completedAt(h.getCompletedAt())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudyHistory getHistoryDetail(String username, Long historyId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        StudyHistory history = studyHistoryRepository.findById(historyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "History record not found"));

        if (!history.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to history record");
        }

        return history;
    }
}
