package com.example.backend.config;

import com.example.backend.entity.Role;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StudentSyncRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StudentService studentService;

    @Override
    public void run(String... args) {
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .forEach(studentService::ensureStudentRecord);
    }
}