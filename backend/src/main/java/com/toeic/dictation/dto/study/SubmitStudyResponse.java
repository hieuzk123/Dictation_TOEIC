package com.toeic.dictation.dto.study;

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
    @Builder.Default
    private List<SegmentResultDto> segmentResults = new ArrayList<>();
}
