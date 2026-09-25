package com.toeic.dictation.dto.study;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SegmentResultDto {
    private Long segmentId;
    private Integer segmentIndex;

    @JsonProperty("isPerfect")
    private boolean isPerfect;

    private int totalWords;
    private int correctWords;

    @Builder.Default
    private List<WordResultDto> wordResults = new ArrayList<>();
}
