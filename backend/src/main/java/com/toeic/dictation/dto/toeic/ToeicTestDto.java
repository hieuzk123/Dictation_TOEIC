package com.toeic.dictation.dto.toeic;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToeicTestDto {
    private Long id;
    private String year;
    private Integer testNumber;
    private String title;
    private String description;
    private int itemCount;
}
