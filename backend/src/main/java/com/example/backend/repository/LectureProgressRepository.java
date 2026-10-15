package com.example.backend.repository;

import com.example.backend.entity.LectureProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    List<LectureProgress> findByStudentIdAndLectureCourseId(Long studentId, Long courseId);
    long countByStudentIdAndLectureCourseId(Long studentId, Long courseId);
    boolean existsByStudentIdAndLectureId(Long studentId, Long lectureId);
    void deleteByStudentIdAndLectureId(Long studentId, Long lectureId);
    void deleteByStudentIdAndLectureCourseId(Long studentId, Long courseId);
    void deleteByLectureId(Long lectureId);
    void deleteByStudentId(Long studentId);
}
