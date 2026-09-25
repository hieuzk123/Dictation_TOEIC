package com.toeic.dictation.dto.toeic;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AudioItemSummaryDto {
    private Long id;
    private Long testId;
    private Integer part;
    private String itemNumber;
    private String title;
    private String audioUrl;
    private BigDecimal totalDuration;
    private Integer totalSegments;
}
