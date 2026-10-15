package com.example.backend.service;

import com.example.backend.dto.request.CourseRequest;
import com.example.backend.dto.response.CourseResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.Tutor;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final TutorRepository tutorRepository;

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CourseResponse getCourseById(Long id) {
        return toResponse(findCourse(id));
    }

    public List<CourseResponse> getMyCourses(String username) {
    Tutor tutor = tutorRepository.findByUserUsername(username)
            .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
    return courseRepository.findByTutorId(tutor.getId()).stream().map(this::toResponse).toList();
    }

    public CourseResponse createCourse(CourseRequest request) {
        Course course = new Course();
        mapToEntity(request, course);
        return toResponse(courseRepository.save(course));
    }

    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = findCourse(id);
        mapToEntity(request, course);
        return toResponse(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        courseRepository.delete(findCourse(id));
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
    }

    private void mapToEntity(CourseRequest request, Course course) {
        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setCredits(request.getCredits());
        course.setImageUrl(request.getImageUrl());

        Tutor tutor = null;
        if (request.getTutorId() != null) {
            tutor = tutorRepository.findById(request.getTutorId())
                    .orElseThrow(() -> new RuntimeException("Tutor not found with id: " + request.getTutorId()));
        }
        course.setTutor(tutor);
    }

    private CourseResponse toResponse(Course course) {
        CourseResponse r = new CourseResponse();
        r.setId(course.getId());
        r.setCode(course.getCode());
        r.setName(course.getName());
        r.setDescription(course.getDescription());
        r.setCredits(course.getCredits());
        r.setImageUrl(course.getImageUrl());
        if (course.getTutor() != null) {
            r.setTutorId(course.getTutor().getId());
            r.setTutorName(course.getTutor().getUser().getFullName());
            r.setTutorPhotoUrl(course.getTutor().getPhotoUrl());
        }
        return r;
    }
}