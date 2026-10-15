package com.example.backend.service;

import com.example.backend.dto.request.CourseRequest;
import com.example.backend.dto.response.CourseResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.EnrollmentStatus;
import com.example.backend.entity.Student;
import com.example.backend.entity.Tutor;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.LectureProgressRepository;
import com.example.backend.repository.LectureRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final TutorRepository tutorRepository;
    private final LectureRepository lectureRepository;
    private final LectureProgressRepository progressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;

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

    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        Course course = new Course();
        mapToEntity(request, course);
        course = courseRepository.save(course);
        notifyTutorAssigned(course, null);
        return toResponse(course);
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = findCourse(id);
        Long oldTutorId = course.getTutor() != null ? course.getTutor().getId() : null;
        mapToEntity(request, course);
        course = courseRepository.save(course);
        notifyTutorAssigned(course, oldTutorId);
        return toResponse(course);
    }

    // Removes everything that hangs off the course first (progress, lectures, enrollments),
    // otherwise the foreign keys block the delete.
    @Transactional
    public void deleteCourse(Long id) {
        Course course = findCourse(id);

        lectureRepository.findByCourseIdOrderByCreatedAtAsc(id)
                .forEach(l -> progressRepository.deleteByLectureId(l.getId()));
        lectureRepository.deleteByCourseId(id);
        enrollmentRepository.deleteByCourseId(id);

        List<Student> students = studentRepository.findByCourseId(id);
        students.forEach(s -> s.setCourse(null));
        studentRepository.saveAll(students);

        courseRepository.delete(course);
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

    private void notifyTutorAssigned(Course course, Long oldTutorId) {
        Tutor tutor = course.getTutor();
        if (tutor != null && !tutor.getId().equals(oldTutorId)) {
            notificationService.notify(tutor.getUser(),
                    "You were assigned to the course " + course.getCode() + " - " + course.getName(),
                    "/courses/" + course.getId());
        }
    }

    private CourseResponse toResponse(Course course) {
        CourseResponse r = new CourseResponse();
        r.setId(course.getId());
        r.setCode(course.getCode());
        r.setName(course.getName());
        r.setDescription(course.getDescription());
        r.setCredits(course.getCredits());
        r.setImageUrl(course.getImageUrl());
        r.setLectureCount(lectureRepository.countByCourseId(course.getId()));
        r.setEnrolledCount(enrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.APPROVED));
        if (course.getTutor() != null) {
            r.setTutorId(course.getTutor().getId());
            r.setTutorName(course.getTutor().getUser().getFullName());
            r.setTutorPhotoUrl(course.getTutor().getPhotoUrl());
        }
        return r;
    }
}
