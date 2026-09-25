package com.toeic.dictation.dto.study;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitStudyRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotBlank(message = "Study mode is required (MEDIUM, HARD, FULL_SENTENCE)")
    private String mode;

    @Builder.Default
    private Integer replaysCount = 0;

    @Builder.Default
    private List<SegmentAnswerDto> answers = new ArrayList<>();
}
