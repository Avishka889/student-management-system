package com.example.backend.service;

import com.example.backend.dto.request.StudentRequest;
import com.example.backend.dto.response.StudentResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.Student;
import com.example.backend.entity.User;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream().map(this::toResponse).toList();
    }

    public StudentResponse getStudentById(Long id) {
        return toResponse(findStudent(id));
    }

    public StudentResponse createStudent(StudentRequest request) {
        Student student = new Student();
        mapToEntity(request, student);
        student = studentRepository.save(student);
        if (student.getStudentNumber() == null) {
            student.setStudentNumber(generateNumber(student.getId()));
            student = studentRepository.save(student);
        }
        return toResponse(student);
    }

    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Student student = findStudent(id);
        mapToEntity(request, student);
        return toResponse(studentRepository.save(student));
    }

    public void deleteStudent(Long id) {
        studentRepository.delete(findStudent(id));
    }

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