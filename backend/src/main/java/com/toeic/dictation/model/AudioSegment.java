package com.toeic.dictation.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "audio_segments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AudioSegment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnore
    private AudioItem item;

    @Column(name = "segment_index", nullable = false)
    private Integer segmentIndex;

    @Column(length = 50)
    private String speaker;

    @Column(name = "start_time", nullable = false, precision = 6, scale = 2)
    private BigDecimal startTime;

    @Column(name = "end_time", nullable = false, precision = 6, scale = 2)
    private BigDecimal endTime;

    @Column(name = "full_transcript", nullable = false, columnDefinition = "TEXT")
    private String fullTranscript;

    @Column(name = "total_words", nullable = false)
    private Integer totalWords;

    @Column(name = "keyword_count", nullable = false)
    private Integer keywordCount;

    @Column(name = "tokens_json", nullable = false, columnDefinition = "JSON")
    private String tokensJson;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
