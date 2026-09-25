package com.toeic.dictation.repository;

import com.toeic.dictation.model.AudioSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AudioSegmentRepository extends JpaRepository<AudioSegment, Long> {
    List<AudioSegment> findByItemIdOrderBySegmentIndexAsc(Long itemId);
}
