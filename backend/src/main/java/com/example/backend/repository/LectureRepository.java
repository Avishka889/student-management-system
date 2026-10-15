package com.example.backend.repository;

import com.example.backend.entity.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findByCourseIdOrderByCreatedAtAsc(Long courseId);
    long countByCourseId(Long courseId);
    void deleteByCourseId(Long courseId);
}
