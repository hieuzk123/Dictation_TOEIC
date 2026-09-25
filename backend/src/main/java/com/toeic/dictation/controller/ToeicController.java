package com.toeic.dictation.controller;

import com.toeic.dictation.dto.toeic.AudioItemDetailDto;
import com.toeic.dictation.dto.toeic.AudioItemSummaryDto;
import com.toeic.dictation.dto.toeic.ToeicTestDto;
import com.toeic.dictation.service.ToeicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ToeicController {

    private final ToeicService toeicService;

    @GetMapping("/tests")
    public ResponseEntity<List<ToeicTestDto>> getAllTests() {
        List<ToeicTestDto> tests = toeicService.getAllTests();
        return ResponseEntity.ok(tests);
    }

    @GetMapping("/tests/{testId}/items")
    public ResponseEntity<List<AudioItemSummaryDto>> getItemsByTest(
            @PathVariable Long testId,
            @RequestParam(required = false) Integer part) {
        List<AudioItemSummaryDto> items = toeicService.getItemsByTest(testId, part);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<AudioItemDetailDto> getItemDetail(@PathVariable Long id) {
        AudioItemDetailDto item = toeicService.getItemDetail(id);
        return ResponseEntity.ok(item);
    }
}
