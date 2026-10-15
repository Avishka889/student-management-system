package com.example.backend.dto.response;

import lombok.Data;

@Data
public class ProfileResponse {
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String photoUrl;
    private String bio;
}