package com.example.backend.dto.response;

import lombok.Data;

@Data
public class CourseResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Integer credits;
    private String imageUrl;
    private Long tutorId;
    private String tutorName;
    private String tutorPhotoUrl;
    private long lectureCount;
    private long enrolledCount;
}
