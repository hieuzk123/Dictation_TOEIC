package com.toeic.dictation.repository;

import com.toeic.dictation.model.ToeicTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ToeicTestRepository extends JpaRepository<ToeicTest, Long> {
    List<ToeicTest> findAllByOrderByYearDescTestNumberAsc();
    Optional<ToeicTest> findByYearAndTestNumber(String year, Integer testNumber);
}
