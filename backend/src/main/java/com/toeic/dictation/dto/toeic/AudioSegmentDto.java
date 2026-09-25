package com.toeic.dictation.dto.toeic;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AudioSegmentDto {
    private Long id;
    private Integer segmentIndex;
    private String speaker;
    private BigDecimal startTime;
    private BigDecimal endTime;
    private String fullTranscript;
    private Integer totalWords;
    private Integer keywordCount;
    private JsonNode tokens;
}
