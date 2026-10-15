package com.example.backend.service;

import com.example.backend.dto.request.LectureRequest;
import com.example.backend.dto.response.LectureResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.EnrollmentStatus;
import com.example.backend.entity.Lecture;
import com.example.backend.entity.LectureProgress;
import com.example.backend.entity.Student;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.LectureProgressRepository;
import com.example.backend.repository.LectureRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LectureService {

    private final LectureRepository lectureRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LectureProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final StudentService studentService;
    private final NotificationService notificationService;

    // ADMIN: any course. TUTOR: only own course. STUDENT: only a course they are approved for.
    public List<LectureResponse> listForCourse(Long courseId, String username, String role) {
        Course course = findCourse(courseId);
        Set<Long> completed = new HashSet<>();

        switch (role) {
            case "ADMIN" -> { }
            case "TUTOR" -> assertOwner(course, username);
            default -> {
                Student student = studentService.findMyStudent(username);
                assertApproved(student, courseId);
                completed = progressRepository.findByStudentIdAndLectureCourseId(student.getId(), courseId)
                        .stream().map(p -> p.getLecture().getId()).collect(Collectors.toSet());
            }
        }

        Set<Long> done = completed;
        return lectureRepository.findByCourseIdOrderByCreatedAtAsc(courseId).stream()
                .map(l -> toResponse(l, done.contains(l.getId())))
                .toList();
    }

    @Transactional
    public LectureResponse create(LectureRequest request, String username) {
        Course course = findCourse(request.getCourseId());
        assertOwner(course, username);

        Lecture lecture = new Lecture();
        applyFields(request, lecture);
        lecture.setCourse(course);
        lecture = lectureRepository.save(lecture);

        // tell every approved student of this course
        Lecture saved = lecture;
        enrollmentRepository.findByCourseIdAndStatus(course.getId(), EnrollmentStatus.APPROVED)
                .forEach(e -> userRepository.findByEmail(e.getStudent().getEmail())
                        .ifPresent(u -> notificationService.notify(u,
                                "New lecture \"" + saved.getTitle() + "\" in " + course.getName(),
                                "/courses/" + course.getId())));

        return toResponse(lecture, false);
    }

    @Transactional
    public LectureResponse update(Long id, LectureRequest request, String username) {
        Lecture lecture = findLecture(id);
        assertOwner(lecture.getCourse(), username);
        applyFields(request, lecture);
        return toResponse(lectureRepository.save(lecture), false);
    }

    @Transactional
    public void delete(Long id, String username) {
        Lecture lecture = findLecture(id);
        assertOwner(lecture.getCourse(), username);
        progressRepository.deleteByLectureId(id);
        lectureRepository.delete(lecture);
    }

    // student ticks / unticks a lecture
    @Transactional
    public LectureResponse setCompleted(Long id, String username, boolean done) {
        Lecture lecture = findLecture(id);
        Student student = studentService.findMyStudent(username);
        assertApproved(student, lecture.getCourse().getId());

        boolean exists = progressRepository.existsByStudentIdAndLectureId(student.getId(), id);
        if (done && !exists) {
            LectureProgress p = new LectureProgress();
            p.setStudent(student);
            p.setLecture(lecture);
            progressRepository.save(p);
        } else if (!done && exists) {
            progressRepository.deleteByStudentIdAndLectureId(student.getId(), id);
        }
        return toResponse(lecture, done);
    }

    // ---------- helpers ----------

    private void assertOwner(Course course, String username) {
        if (course.getTutor() == null
                || !course.getTutor().getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("You can only manage lectures of your own courses");
        }
    }

    private void assertApproved(Student student, Long courseId) {
        if (!enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(
                student.getId(), courseId, EnrollmentStatus.APPROVED)) {
            throw new AccessDeniedException("You are not enrolled in this course");
        }
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
    }

    private Lecture findLecture(Long id) {
        return lectureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecture not found with id: " + id));
    }

    private void applyFields(LectureRequest request, Lecture lecture) {
        lecture.setTitle(request.getTitle().trim());
        lecture.setDescription(blankToNull(request.getDescription()));
        lecture.setVideoUrl(blankToNull(request.getVideoUrl()));
        lecture.setPdfUrl(blankToNull(request.getPdfUrl()));
    }

    private String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private LectureResponse toResponse(Lecture l, boolean completed) {
        LectureResponse r = new LectureResponse();
        r.setId(l.getId());
        r.setCourseId(l.getCourse().getId());
        r.setTitle(l.getTitle());
        r.setDescription(l.getDescription());
        r.setVideoUrl(l.getVideoUrl());
        r.setPdfUrl(l.getPdfUrl());
        r.setCreatedAt(l.getCreatedAt());
        r.setCompleted(completed);
        return r;
    }
}
