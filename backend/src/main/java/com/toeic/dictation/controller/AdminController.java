package com.toeic.dictation.controller;

import com.toeic.dictation.dto.AdminStatsResponse;
import com.toeic.dictation.dto.AdminUploadResponse;
import com.toeic.dictation.service.AdminContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminContentService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Map<String, String>> deleteItem(@PathVariable Long id) {
        adminService.deleteAudioItem(id);
        return ResponseEntity.ok(Map.of(
                "message", "AudioItem deleted successfully",
                "id", id.toString()
        ));
    }

    @PostMapping("/tests")
    public ResponseEntity<com.toeic.dictation.dto.toeic.ToeicTestDto> createTest(
            @jakarta.validation.Valid @RequestBody com.toeic.dictation.dto.CreateTestRequest request
    ) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(adminService.createTest(request));
    }

    @PostMapping("/items/upload")
    public ResponseEntity<AdminUploadResponse> uploadItem(
            @RequestParam(value = "testId", required = false) Long testId,
            @RequestParam("part") Integer part,
            @RequestParam("itemNumber") String itemNumber,
            @RequestParam("title") String title,
            @RequestParam("audioFile") MultipartFile audioFile,
            @RequestParam(value = "transcriptText", required = false) String transcriptText,
            @RequestParam(value = "newTestYear", required = false) String newTestYear,
            @RequestParam(value = "newTestNumber", required = false) Integer newTestNumber,
            @RequestParam(value = "newTestTitle", required = false) String newTestTitle
    ) throws IOException {
        AdminUploadResponse response = adminService.uploadAndCreateItem(
                testId,
                part,
                itemNumber,
                title,
                audioFile,
                transcriptText,
                newTestYear,
                newTestNumber,
                newTestTitle
        );
        return ResponseEntity.ok(response);
    }
}

