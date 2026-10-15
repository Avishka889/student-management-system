package com.example.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TutorUpdateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    private String email;

    private String phone;

    private String bio;

    private String photoUrl;

    // optional: set only to reset the tutor's password
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}