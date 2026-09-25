package com.toeic.dictation.dto.toeic;

import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AudioItemDetailDto {
    private Long id;
    private Long testId;
    private String testTitle;
    private Integer part;
    private String itemNumber;
    private String title;
    private String audioUrl;
    private BigDecimal totalDuration;
    private Integer totalSegments;
    @Builder.Default
    private List<AudioSegmentDto> segments = new ArrayList<>();
}
