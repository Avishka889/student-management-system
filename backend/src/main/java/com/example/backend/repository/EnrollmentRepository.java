package com.example.backend.repository;

import com.example.backend.entity.Enrollment;
import com.example.backend.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findAllByOrderByRequestedAtDesc();
    List<Enrollment> findByStatusOrderByRequestedAtDesc(EnrollmentStatus status);
    List<Enrollment> findByStudentIdOrderByRequestedAtDesc(Long studentId);
    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
    List<Enrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);
    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, EnrollmentStatus status);
    long countByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
    void deleteByCourseId(Long courseId);
    void deleteByStudentId(Long studentId);
}
