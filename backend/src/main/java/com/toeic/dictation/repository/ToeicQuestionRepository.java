package com.toeic.dictation.repository;

import com.toeic.dictation.model.ToeicQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToeicQuestionRepository extends JpaRepository<ToeicQuestion, Long> {
    List<ToeicQuestion> findByItemIdOrderByQuestionNumberAsc(Long itemId);
}
