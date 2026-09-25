package com.toeic.dictation.dto.study;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyHistoryDto {
    private Long id;
    private Long itemId;
    private String itemTitle;
    private Integer part;
    private String itemNumber;
    private String mode;
    private BigDecimal accuracyRate;
    private Integer replaysCount;
    private Integer wrongSegmentsCount;
    private LocalDateTime completedAt;
}
