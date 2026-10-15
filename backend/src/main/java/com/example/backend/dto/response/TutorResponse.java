package com.example.backend.dto.response;

import lombok.Data;

@Data
public class TutorResponse {
    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String bio;
    private String photoUrl;
    private boolean active;
    private long courseCount;
}