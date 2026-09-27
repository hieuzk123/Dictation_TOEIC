package com.toeic.dictation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUploadResponse {
    private Long itemId;
    private String title;
    private String audioUrl;
    private int totalSegments;
    private String message;
}
