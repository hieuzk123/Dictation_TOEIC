package com.toeic.dictation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.toeic.AudioItemDetailDto;
import com.toeic.dictation.dto.toeic.AudioItemSummaryDto;
import com.toeic.dictation.dto.toeic.AudioSegmentDto;
import com.toeic.dictation.dto.toeic.ToeicTestDto;
import com.toeic.dictation.model.AudioItem;
import com.toeic.dictation.model.AudioSegment;
import com.toeic.dictation.model.ToeicTest;
import com.toeic.dictation.repository.AudioItemRepository;
import com.toeic.dictation.repository.AudioSegmentRepository;
import com.toeic.dictation.repository.ToeicTestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToeicService {

    private final ToeicTestRepository toeicTestRepository;
    private final AudioItemRepository audioItemRepository;
    private final AudioSegmentRepository audioSegmentRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ToeicTestDto> getAllTests() {
        List<ToeicTest> tests = toeicTestRepository.findAllByOrderByYearDescTestNumberAsc();
        return tests.stream().map(test -> {
            List<AudioItem> items = audioItemRepository.findByTestIdOrderByPartAscItemNumberAsc(test.getId());
            return ToeicTestDto.builder()
                    .id(test.getId())
                    .year(test.getYear())
                    .testNumber(test.getTestNumber())
                    .title(test.getTitle())
                    .description(test.getDescription())
                    .itemCount(items.size())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AudioItemSummaryDto> getItemsByTest(Long testId, Integer part, String search) {
        if (!toeicTestRepository.existsById(testId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found with id: " + testId);
        }

        String searchPattern = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<AudioItem> items = audioItemRepository.findItemsWithFilter(testId, part, searchPattern);

        return items.stream().map(this::mapToSummaryDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AudioItemSummaryDto> getItemsByTest(Long testId, Integer part) {
        return getItemsByTest(testId, part, null);
    }

    @Transactional(readOnly = true)
    public AudioItemDetailDto getItemDetail(Long id) {
        AudioItem item = audioItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audio item not found with id: " + id));

        List<AudioSegment> segments = audioSegmentRepository.findByItemIdOrderBySegmentIndexAsc(item.getId());

        List<AudioSegmentDto> segmentDtos = segments.stream().map(this::mapSegmentDto).collect(Collectors.toList());

        return AudioItemDetailDto.builder()
                .id(item.getId())
                .testId(item.getTest().getId())
                .testTitle(item.getTest().getTitle())
                .part(item.getPart())
                .itemNumber(item.getItemNumber())
                .title(item.getTitle())
                .audioUrl(item.getAudioUrl())
                .totalDuration(item.getTotalDuration())
                .totalSegments(segments.size())
                .segments(segmentDtos)
                .build();
    }

    private AudioItemSummaryDto mapToSummaryDto(AudioItem item) {
        return AudioItemSummaryDto.builder()
                .id(item.getId())
                .testId(item.getTest().getId())
                .part(item.getPart())
                .itemNumber(item.getItemNumber())
                .title(item.getTitle())
                .audioUrl(item.getAudioUrl())
                .totalDuration(item.getTotalDuration())
                .totalSegments(item.getTotalSegments())
                .build();
    }

    private AudioSegmentDto mapSegmentDto(AudioSegment segment) {
        JsonNode parsedTokens = null;
        if (segment.getTokensJson() != null) {
            try {
                parsedTokens = objectMapper.readTree(segment.getTokensJson());
            } catch (JsonProcessingException e) {
                log.error("Error parsing tokensJson for segment id {}", segment.getId(), e);
            }
        }

        return AudioSegmentDto.builder()
                .id(segment.getId())
                .segmentIndex(segment.getSegmentIndex())
                .speaker(segment.getSpeaker())
                .startTime(segment.getStartTime())
                .endTime(segment.getEndTime())
                .fullTranscript(segment.getFullTranscript())
                .totalWords(segment.getTotalWords())
                .keywordCount(segment.getKeywordCount())
                .tokens(parsedTokens)
                .build();
    }
}
