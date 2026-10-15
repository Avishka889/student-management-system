package com.example.backend.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentNumber;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private String courseImageUrl;
    private String tutorName;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime decidedAt;
    private long totalLectures;
    private long completedLectures;
    private int progressPercent;
}
