package com.example.backend.service;

import com.example.backend.dto.request.ProfileUpdateRequest;
import com.example.backend.dto.response.ProfileResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tutor;
import com.example.backend.entity.User;
import com.example.backend.repository.TutorRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final StudentService studentService;

    public ProfileResponse getProfile(String username) {
        return toResponse(findUser(username));
    }

    @Transactional
    public ProfileResponse update(String username, ProfileUpdateRequest request) {
        User user = findUser(username);
        user.setFullName(request.getFullName().trim());
        user.setPhone(blankToNull(request.getPhone()));

        if (user.getRole() == Role.TUTOR) {
            Tutor tutor = findTutor(username);
            tutor.setBio(request.getBio());
            tutor.setPhotoUrl(blankToNull(request.getPhotoUrl()));
            tutorRepository.save(tutor);
        } else {
            user.setPhotoUrl(blankToNull(request.getPhotoUrl()));
        }
        userRepository.save(user);

        if (user.getRole() == Role.STUDENT) {
            studentService.syncFromUser(user);
        }
        return toResponse(user);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Tutor findTutor(String username) {
        return tutorRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
    }

    private String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v;
    }

    private ProfileResponse toResponse(User user) {
        ProfileResponse r = new ProfileResponse();
        r.setUsername(user.getUsername());
        r.setFullName(user.getFullName());
        r.setEmail(user.getEmail());
        r.setPhone(user.getPhone());
        r.setRole(user.getRole().name());
        if (user.getRole() == Role.TUTOR) {
            Tutor tutor = findTutor(user.getUsername());
            r.setPhotoUrl(tutor.getPhotoUrl());
            r.setBio(tutor.getBio());
        } else {
            r.setPhotoUrl(user.getPhotoUrl());
        }
        return r;
    }
}