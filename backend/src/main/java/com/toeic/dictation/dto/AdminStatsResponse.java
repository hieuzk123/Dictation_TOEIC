package com.toeic.dictation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalTests;
    private long totalAudioItems;
    private long totalSegments;
    private long totalUsers;
    private long totalStudySessions;
}
