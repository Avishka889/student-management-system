package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LectureRequest {

    // only needed when creating; ignored on update
    @NotNull(message = "Course is required")
    private Long courseId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @Pattern(regexp = "^$|^https?://\\S+$", message = "Video link must start with http:// or https://")
    private String videoUrl;

    @Pattern(regexp = "^$|^https?://\\S+$", message = "PDF link must start with http:// or https://")
    private String pdfUrl;
}
