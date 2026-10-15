package com.example.backend.controller;

import com.example.backend.dto.request.StudentRequest;
import com.example.backend.dto.response.StudentResponse;
import com.example.backend.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    // ---------- student's own endpoint ----------
    // (course requests / leaving a course live in EnrollmentController)

    @GetMapping("/me")
    public StudentResponse me(Authentication auth) {
        return studentService.getMyProfile(auth.getName());
    }

    // ---------- admin endpoints ----------

    @GetMapping
    public List<StudentResponse> getAll() {
        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public StudentResponse getById(@PathVariable Long id) {
        return studentService.getStudentById(id);
    }

    @PostMapping
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.createStudent(request));
    }

    @PutMapping("/{id}")
    public StudentResponse update(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return studentService.updateStudent(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
