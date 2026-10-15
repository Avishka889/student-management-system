package com.example.backend.dto.response;

import lombok.Data;

@Data
public class StudentResponse {
    private Long id;
    private String studentNumber;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Long courseId;
    private String courseName;
}