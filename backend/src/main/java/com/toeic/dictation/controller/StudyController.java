package com.toeic.dictation.controller;

import com.toeic.dictation.dto.study.StudyHistoryDto;
import com.toeic.dictation.dto.study.SubmitStudyRequest;
import com.toeic.dictation.dto.study.SubmitStudyResponse;
import com.toeic.dictation.model.StudyHistory;
import com.toeic.dictation.service.StudyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;

    @PostMapping("/submit")
    public ResponseEntity<SubmitStudyResponse> submitStudy(
            Principal principal,
            @Valid @RequestBody SubmitStudyRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        SubmitStudyResponse response = studyService.submitStudy(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<StudyHistoryDto>> getUserHistories(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<StudyHistoryDto> histories = studyService.getUserHistories(principal.getName());
        return ResponseEntity.ok(histories);
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<StudyHistory> getHistoryDetail(
            Principal principal,
            @PathVariable Long id) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        StudyHistory history = studyService.getHistoryDetail(principal.getName(), id);
        return ResponseEntity.ok(history);
    }
}
