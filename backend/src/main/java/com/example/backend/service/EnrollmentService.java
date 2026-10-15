package com.example.backend.service;

import com.example.backend.dto.response.EnrollmentResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.Enrollment;
import com.example.backend.entity.EnrollmentStatus;
import com.example.backend.entity.Student;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.LectureProgressRepository;
import com.example.backend.repository.LectureRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final LectureRepository lectureRepository;
    private final LectureProgressRepository progressRepository;
    private final StudentService studentService;
    private final NotificationService notificationService;

    // ---------- student side ----------

    public List<EnrollmentResponse> myEnrollments(String username) {
        Student student = studentService.findMyStudent(username);
        return enrollmentRepository.findByStudentIdOrderByRequestedAtDesc(student.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public EnrollmentResponse request(String username, Long courseId) {
        Student student = studentService.findMyStudent(username);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + courseId));

        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCourseId(student.getId(), courseId)
                .orElseGet(Enrollment::new);

        if (enrollment.getId() != null) {
            if (enrollment.getStatus() == EnrollmentStatus.PENDING) {
                throw new IllegalStateException("You already have a pending request for this course");
            }
            if (enrollment.getStatus() == EnrollmentStatus.APPROVED) {
                throw new IllegalStateException("You are already enrolled in this course");
            }
            // REJECTED earlier -> the student may ask again
        }

        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setStatus(EnrollmentStatus.PENDING);
        enrollment.setRequestedAt(LocalDateTime.now());
        enrollment.setDecidedAt(null);
        enrollment = enrollmentRepository.save(enrollment);

        notificationService.notifyAdmins(
                student.getFirstName() + " " + student.getLastName()
                        + " requested to join " + course.getCode() + " - " + course.getName(),
                "/enrollments");

        return toResponse(enrollment);
    }

    // Cancel a pending request, or leave a course you were approved for
    @Transactional
    public void cancelOrLeave(String username, Long enrollmentId) {
        Student student = studentService.findMyStudent(username);
        Enrollment enrollment = findEnrollment(enrollmentId);
        if (!enrollment.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException("This enrollment does not belong to you");
        }

        Long courseId = enrollment.getCourse().getId();
        boolean wasApproved = enrollment.getStatus() == EnrollmentStatus.APPROVED;

        if (wasApproved) {
            progressRepository.deleteByStudentIdAndLectureCourseId(student.getId(), courseId);
        }
        enrollmentRepository.delete(enrollment);

        // Student.course holds the "current" approved course; keep it pointing at something valid
        if (wasApproved && student.getCourse() != null && student.getCourse().getId().equals(courseId)) {
            Course next = enrollmentRepository
                    .findByStudentIdAndStatus(student.getId(), EnrollmentStatus.APPROVED).stream()
                    .filter(e -> !e.getId().equals(enrollmentId))
                    .map(Enrollment::getCourse)
                    .findFirst().orElse(null);
            student.setCourse(next);
            studentRepository.save(student);
        }
    }

    // ---------- admin side ----------

    public List<EnrollmentResponse> getAll(String status) {
        List<Enrollment> list;
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            list = enrollmentRepository.findAllByOrderByRequestedAtDesc();
        } else {
            EnrollmentStatus s;
            try {
                s = EnrollmentStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalStateException("Unknown status: " + status);
            }
            list = enrollmentRepository.findByStatusOrderByRequestedAtDesc(s);
        }
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional
    public EnrollmentResponse approve(Long id) {
        Enrollment enrollment = findEnrollment(id);
        if (enrollment.getStatus() == EnrollmentStatus.APPROVED) {
            throw new IllegalStateException("This request is already approved");
        }
        enrollment.setStatus(EnrollmentStatus.APPROVED);
        enrollment.setDecidedAt(LocalDateTime.now());
        enrollment = enrollmentRepository.save(enrollment);

        Student student = enrollment.getStudent();
        student.setCourse(enrollment.getCourse());
        studentRepository.save(student);

        notifyStudent(enrollment, "Your request to join " + enrollment.getCourse().getName() + " was approved",
                "/courses/" + enrollment.getCourse().getId());
        return toResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse reject(Long id) {
        Enrollment enrollment = findEnrollment(id);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be rejected");
        }
        enrollment.setStatus(EnrollmentStatus.REJECTED);
        enrollment.setDecidedAt(LocalDateTime.now());
        enrollment = enrollmentRepository.save(enrollment);

        notifyStudent(enrollment, "Your request to join " + enrollment.getCourse().getName() + " was rejected",
                "/courses/" + enrollment.getCourse().getId());
        return toResponse(enrollment);
    }

    // ---------- helpers ----------

    private void notifyStudent(Enrollment enrollment, String message, String link) {
        userRepository.findByEmail(enrollment.getStudent().getEmail())
                .ifPresent(user -> notificationService.notify(user, message, link));
    }

    private Enrollment findEnrollment(Long id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + id));
    }

    private EnrollmentResponse toResponse(Enrollment e) {
        Student s = e.getStudent();
        Course c = e.getCourse();

        EnrollmentResponse r = new EnrollmentResponse();
        r.setId(e.getId());
        r.setStudentId(s.getId());
        r.setStudentName(s.getFirstName() + " " + s.getLastName());
        r.setStudentNumber(s.getStudentNumber());
        r.setCourseId(c.getId());
        r.setCourseCode(c.getCode());
        r.setCourseName(c.getName());
        r.setCourseImageUrl(c.getImageUrl());
        if (c.getTutor() != null) {
            r.setTutorName(c.getTutor().getUser().getFullName());
        }
        r.setStatus(e.getStatus().name());
        r.setRequestedAt(e.getRequestedAt());
        r.setDecidedAt(e.getDecidedAt());

        if (e.getStatus() == EnrollmentStatus.APPROVED) {
            long total = lectureRepository.countByCourseId(c.getId());
            long done = progressRepository.countByStudentIdAndLectureCourseId(s.getId(), c.getId());
            r.setTotalLectures(total);
            r.setCompletedLectures(done);
            r.setProgressPercent(total == 0 ? 0 : (int) Math.round(done * 100.0 / total));
        }
        return r;
    }
}
