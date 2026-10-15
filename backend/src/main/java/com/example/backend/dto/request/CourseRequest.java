package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourseRequest {

    @NotBlank(message = "Course code is required")
    private String code;

    @NotBlank(message = "Course name is required")
    private String name;

    private String description;

    private Integer credits;

    private String imageUrl;

    private Long tutorId;
}