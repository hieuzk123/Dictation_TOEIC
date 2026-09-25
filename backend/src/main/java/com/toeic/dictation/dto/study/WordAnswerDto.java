package com.toeic.dictation.dto.study;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordAnswerDto {
    private Integer wordIndex;
    private String targetWord;
    private String userWord;
}
