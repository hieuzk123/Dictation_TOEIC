package com.toeic.dictation.repository;

import com.toeic.dictation.model.AudioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AudioItemRepository extends JpaRepository<AudioItem, Long> {
    List<AudioItem> findByTestIdOrderByPartAscItemNumberAsc(Long testId);
    List<AudioItem> findByTestIdAndPartOrderByItemNumberAsc(Long testId, Integer part);

    @Query("SELECT DISTINCT i FROM AudioItem i LEFT JOIN FETCH i.segments WHERE i.id = :id")
    Optional<AudioItem> findByIdWithSegments(@Param("id") Long id);
}
