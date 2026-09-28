package com.toeic.dictation.dto.study;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitStudyResponse {
    private Long historyId;
    private Long itemId;
    private String mode;
    private BigDecimal accuracyRate;
    private int totalWords;
    private int correctWords;
    private int wrongSegmentsCount;
    private int replaysCount;
    private int totalQuestions;
    private int correctQuestions;
    @Builder.Default
    private List<SegmentResultDto> segmentResults = new ArrayList<>();
    @Builder.Default
    private List<QuestionResultDto> questionResults = new ArrayList<>();

    @JsonProperty("results")
    public List<SegmentResultDto> getResults() {
        return segmentResults;
    }
}
