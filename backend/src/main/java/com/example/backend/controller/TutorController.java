package com.example.backend.controller;

import com.example.backend.dto.request.TutorCreateRequest;
import com.example.backend.dto.request.TutorUpdateRequest;
import com.example.backend.dto.response.TutorResponse;
import com.example.backend.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tutors")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService tutorService;

    @GetMapping
    public List<TutorResponse> getAll() {
        return tutorService.getAll();
    }

    @PostMapping
    public ResponseEntity<TutorResponse> create(@Valid @RequestBody TutorCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tutorService.create(request));
    }

    @PutMapping("/{id}")
    public TutorResponse update(@PathVariable Long id, @Valid @RequestBody TutorUpdateRequest request) {
        return tutorService.update(id, request);
    }

    @PutMapping("/{id}/toggle")
    public TutorResponse toggle(@PathVariable Long id) {
        return tutorService.toggleActive(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tutorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}