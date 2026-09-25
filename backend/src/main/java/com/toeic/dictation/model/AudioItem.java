package com.toeic.dictation.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "audio_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AudioItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    @JsonIgnore
    private ToeicTest test;

    @Column(nullable = false)
    private Integer part;

    @Column(name = "item_number", nullable = false, length = 50)
    private String itemNumber;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "audio_url", nullable = false, length = 255)
    private String audioUrl;

    @Column(name = "total_duration", nullable = false, precision = 6, scale = 2)
    private BigDecimal totalDuration;

    @Column(name = "total_segments", nullable = false)
    @Builder.Default
    private Integer totalSegments = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("segmentIndex ASC")
    @Builder.Default
    private List<AudioSegment> segments = new ArrayList<>();
}
