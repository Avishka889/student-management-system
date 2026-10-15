package com.example.backend.repository;

import com.example.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTutorId(Long tutorId);
    long countByTutorId(Long tutorId);
}