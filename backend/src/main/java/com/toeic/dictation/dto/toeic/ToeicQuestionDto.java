package com.toeic.dictation.dto.toeic;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToeicQuestionDto {
    private Long id;
    private Integer questionNumber;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String explanation;
}
