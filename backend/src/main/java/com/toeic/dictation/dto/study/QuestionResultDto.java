package com.toeic.dictation.dto.study;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResultDto {
    private Long questionId;
    private Integer questionNumber;
    private String selectedOption;
    private String correctOption;
    @JsonProperty("correct")
    private boolean correct;
    private String explanation;
}
