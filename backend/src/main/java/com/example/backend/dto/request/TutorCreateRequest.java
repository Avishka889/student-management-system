package com.example.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TutorCreateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    private String email;

    private String phone;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be 3 to 30 characters")
    private String username;

    @NotBlank(message = "Temporary password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String bio;

    private String photoUrl;
}