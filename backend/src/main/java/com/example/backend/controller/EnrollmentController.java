package com.example.backend.controller;

import com.example.backend.dto.response.EnrollmentResponse;
import com.example.backend.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    // ---------- student ----------

    @GetMapping("/me")
    public List<EnrollmentResponse> mine(Authentication auth) {
        return enrollmentService.myEnrollments(auth.getName());
    }

    @PostMapping("/request/{courseId}")
    public ResponseEntity<EnrollmentResponse> request(@PathVariable Long courseId, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.request(auth.getName(), courseId));
    }

    // cancel a pending request or leave an approved course
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelOrLeave(@PathVariable Long id, Authentication auth) {
        enrollmentService.cancelOrLeave(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // ---------- admin ----------

    @GetMapping
    public List<EnrollmentResponse> all(@RequestParam(required = false) String status) {
        return enrollmentService.getAll(status);
    }

    @PutMapping("/{id}/approve")
    public EnrollmentResponse approve(@PathVariable Long id) {
        return enrollmentService.approve(id);
    }

    @PutMapping("/{id}/reject")
    public EnrollmentResponse reject(@PathVariable Long id) {
        return enrollmentService.reject(id);
    }
}
