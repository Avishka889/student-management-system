package com.example.backend.service;

import com.example.backend.dto.request.StudentRequest;
import com.example.backend.dto.response.StudentResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.Enrollment;
import com.example.backend.entity.EnrollmentStatus;
import com.example.backend.entity.Role;
import com.example.backend.entity.Student;
import com.example.backend.entity.User;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.LectureProgressRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LectureProgressRepository progressRepository;

    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream().map(this::toResponse).toList();
    }

    public StudentResponse getStudentById(Long id) {
        return toResponse(findStudent(id));
    }

    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        Student student = new Student();
        mapToEntity(request, student);
        student = studentRepository.save(student);
        if (student.getStudentNumber() == null) {
            student.setStudentNumber(generateNumber(student.getId()));
            student = studentRepository.save(student);
        }
        syncEnrollment(student, null);
        return toResponse(student);
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Student student = findStudent(id);
        Course oldCourse = student.getCourse();
        mapToEntity(request, student);
        student = studentRepository.save(student);
        syncEnrollment(student, oldCourse);
        return toResponse(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = findStudent(id);
        progressRepository.deleteByStudentId(id);
        enrollmentRepository.deleteByStudentId(id);
        studentRepository.delete(student);
    }

    // ---------- student's own profile ----------

    public StudentResponse getMyProfile(String username) {
        return toResponse(findMyStudent(username));
    }

    // Enrolling / leaving a course now goes through EnrollmentService (request -> admin approval)

    // ---------- keeping student records in sync with user accounts ----------

    // Called when a STUDENT account registers (or on startup for old accounts)
    public void ensureStudentRecord(User user) {
        if (studentRepository.existsByEmail(user.getEmail())) {
            return;
        }
        String[] parts = user.getFullName().trim().split("\\s+", 2);
        Student student = new Student();
        student.setFirstName(parts[0]);
        student.setLastName(parts.length > 1 ? parts[1] : "-");
        student.setEmail(user.getEmail());
        student.setPhone(user.getPhone());
        student = studentRepository.save(student);
        student.setStudentNumber(generateNumber(student.getId()));
        studentRepository.save(student);
    }

    // Called when a student updates their profile (name / phone)
    public void syncFromUser(User user) {
        studentRepository.findByEmail(user.getEmail()).ifPresent(s -> {
            String[] parts = user.getFullName().trim().split("\\s+", 2);
            s.setFirstName(parts[0]);
            s.setLastName(parts.length > 1 ? parts[1] : "-");
            s.setPhone(user.getPhone());
            studentRepository.save(s);
        });
    }

    // Called on startup: students that already had a course before the enrollment feature existed
    // get an APPROVED enrollment so they show up in counts / "My courses".
    @Transactional
    public void backfillEnrollments() {
        studentRepository.findAll().stream()
                .filter(s -> s.getCourse() != null)
                .forEach(s -> syncEnrollment(s, null));
    }

    // ---------- helpers ----------

    // used by EnrollmentService / LectureService
    public Student findMyStudent(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students have a student profile");
        }
        ensureStudentRecord(user);
        return studentRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
    }

    // When the admin sets / changes a student's course by hand, keep the enrollments table in step:
    // the new course gets an APPROVED enrollment, the replaced one is removed.
    private void syncEnrollment(Student student, Course oldCourse) {
        Course now = student.getCourse();

        if (oldCourse != null && (now == null || !oldCourse.getId().equals(now.getId()))) {
            enrollmentRepository.findByStudentIdAndCourseId(student.getId(), oldCourse.getId())
                    .ifPresent(enrollmentRepository::delete);
            progressRepository.deleteByStudentIdAndLectureCourseId(student.getId(), oldCourse.getId());
        }

        if (now != null) {
            Enrollment e = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), now.getId())
                    .orElseGet(Enrollment::new);
            if (e.getStatus() != EnrollmentStatus.APPROVED || e.getId() == null) {
                e.setStudent(student);
                e.setCourse(now);
                e.setStatus(EnrollmentStatus.APPROVED);
                e.setDecidedAt(LocalDateTime.now());
                enrollmentRepository.save(e);
            }
        }
    }

    private String generateNumber(Long id) {
        return String.format("ST%04d", id);
    }

    private Student findStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }

    private void mapToEntity(StudentRequest request, Student student) {
        String number = request.getStudentNumber();
        if (number != null && !number.isBlank()) {
            student.setStudentNumber(number.trim());
        }
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());

        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + request.getCourseId()));
        }
        student.setCourse(course);
    }

    private StudentResponse toResponse(Student student) {
        StudentResponse response = new StudentResponse();
        response.setId(student.getId());
        response.setStudentNumber(student.getStudentNumber());
        response.setFirstName(student.getFirstName());
        response.setLastName(student.getLastName());
        response.setEmail(student.getEmail());
        response.setPhone(student.getPhone());
        if (student.getCourse() != null) {
            response.setCourseId(student.getCourse().getId());
            response.setCourseName(student.getCourse().getName());
        }
        return response;
    }
}
