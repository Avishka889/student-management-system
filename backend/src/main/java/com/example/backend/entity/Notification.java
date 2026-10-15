package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String message;

    // frontend route to open when the notification is clicked, e.g. /courses/3
    private String link;

    @Column(nullable = false)
    private boolean seen = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
