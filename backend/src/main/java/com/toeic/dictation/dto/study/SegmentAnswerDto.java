package com.toeic.dictation.dto.study;

import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SegmentAnswerDto {
    private Long segmentId;
    private String userTranscript;
    @Builder.Default
    private List<WordAnswerDto> wordAnswers = new ArrayList<>();
}
