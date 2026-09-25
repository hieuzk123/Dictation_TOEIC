package com.toeic.dictation.repository;

import com.toeic.dictation.model.StudyHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyHistoryRepository extends JpaRepository<StudyHistory, Long> {
    List<StudyHistory> findByUserIdOrderByCompletedAtDesc(Long userId);
    List<StudyHistory> findByUserIdAndItemIdOrderByCompletedAtDesc(Long userId, Long itemId);
}
