package com.toeic.dictation.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private AudioItem item;

    @Column(nullable = false, length = 30)
    private String mode; // MEDIUM, HARD, FULL_SENTENCE

    @Column(name = "accuracy_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracyRate;

    @Column(name = "replays_count", nullable = false)
    @Builder.Default
    private Integer replaysCount = 0;

    @Column(name = "wrong_segments_count", nullable = false)
    @Builder.Default
    private Integer wrongSegmentsCount = 0;

    @Column(name = "details_json", columnDefinition = "JSON")
    private String detailsJson;

    @Column(name = "completed_at", insertable = false, updatable = false)
    private LocalDateTime completedAt;
}
