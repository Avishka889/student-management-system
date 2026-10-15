package com.example.backend.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private String message;
    private String link;
    private boolean seen;
    private LocalDateTime createdAt;
}
