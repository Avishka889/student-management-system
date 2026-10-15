package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "courses")
@Data
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer credits;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;
}