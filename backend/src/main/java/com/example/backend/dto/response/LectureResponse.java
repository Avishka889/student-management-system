package com.example.backend.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LectureResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private String videoUrl;
    private String pdfUrl;
    private LocalDateTime createdAt;
    // only meaningful for students: did this student mark the lecture as done
    private boolean completed;
}
