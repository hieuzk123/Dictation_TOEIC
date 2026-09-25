package com.toeic.dictation.dto.study;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordResultDto {
    private Integer wordIndex;
    private String targetWord;
    private String userWord;

    @JsonProperty("isCorrect")
    private boolean isCorrect;
}
