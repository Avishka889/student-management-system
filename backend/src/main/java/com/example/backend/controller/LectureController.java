package com.example.backend.controller;

import com.example.backend.dto.request.LectureRequest;
import com.example.backend.dto.response.LectureResponse;
import com.example.backend.service.LectureService;
import com.example.backend.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
public class LectureController {

    private final LectureService lectureService;
    private final StorageService storageService;

    // any logged in user; the service decides if they may see this course's lectures
    @GetMapping("/course/{courseId}")
    public List<LectureResponse> byCourse(@PathVariable Long courseId, Authentication auth) {
        return lectureService.listForCourse(courseId, auth.getName(), roleOf(auth));
    }

    // ---------- tutor ----------

    // upload a PDF, returns its public link
    @PostMapping("/upload")
    public Map<String, String> uploadPdf(@RequestParam("file") MultipartFile file) {
        return Map.of("url", storageService.uploadPdf(file));
    }

    @PostMapping
    public ResponseEntity<LectureResponse> create(@Valid @RequestBody LectureRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lectureService.create(request, auth.getName()));
    }

    @PutMapping("/{id}")
    public LectureResponse update(@PathVariable Long id, @Valid @RequestBody LectureRequest request, Authentication auth) {
        return lectureService.update(id, request, auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        lectureService.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    // ---------- student ----------

    @PutMapping("/{id}/complete")
    public LectureResponse complete(@PathVariable Long id, Authentication auth) {
        return lectureService.setCompleted(id, auth.getName(), true);
    }

    @DeleteMapping("/{id}/complete")
    public LectureResponse uncomplete(@PathVariable Long id, Authentication auth) {
        return lectureService.setCompleted(id, auth.getName(), false);
    }

    private String roleOf(Authentication auth) {
        return auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("STUDENT");
    }
}
