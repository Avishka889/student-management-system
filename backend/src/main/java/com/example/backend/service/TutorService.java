package com.example.backend.service;

import com.example.backend.dto.request.TutorCreateRequest;
import com.example.backend.dto.request.TutorUpdateRequest;
import com.example.backend.dto.response.TutorResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tutor;
import com.example.backend.entity.User;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.TutorRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TutorService {

    private final TutorRepository tutorRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    public List<TutorResponse> getAll() {
        return tutorRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public TutorResponse create(TutorCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalStateException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Email already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.TUTOR);
        user.setMustChangePassword(true);
        user.setActive(true);
        userRepository.save(user);

        Tutor tutor = new Tutor();
        tutor.setUser(user);
        tutor.setBio(request.getBio());
        tutor.setPhotoUrl(blankToNull(request.getPhotoUrl()));
        return toResponse(tutorRepository.save(tutor));
    }

    @Transactional
    public TutorResponse update(Long id, TutorUpdateRequest request) {
        Tutor tutor = findTutor(id);
        User user = tutor.getUser();

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Email already registered");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setMustChangePassword(true);
        }
        userRepository.save(user);

        tutor.setBio(request.getBio());
        tutor.setPhotoUrl(blankToNull(request.getPhotoUrl()));
        return toResponse(tutorRepository.save(tutor));
    }

    @Transactional
    public TutorResponse toggleActive(Long id) {
        Tutor tutor = findTutor(id);
        User user = tutor.getUser();
        user.setActive(!user.isActive());
        userRepository.save(user);
        return toResponse(tutor);
    }

    @Transactional
    public void delete(Long id) {
        Tutor tutor = findTutor(id);
        List<Course> courses = courseRepository.findByTutorId(id);
        courses.forEach(c -> c.setTutor(null));
        courseRepository.saveAll(courses);
        User user = tutor.getUser();
        tutorRepository.delete(tutor);
        userRepository.delete(user);
    }

    private Tutor findTutor(Long id) {
        return tutorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tutor not found with id: " + id));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private TutorResponse toResponse(Tutor tutor) {
        User user = tutor.getUser();
        TutorResponse r = new TutorResponse();
        r.setId(tutor.getId());
        r.setFullName(user.getFullName());
        r.setUsername(user.getUsername());
        r.setEmail(user.getEmail());
        r.setPhone(user.getPhone());
        r.setBio(tutor.getBio());
        r.setPhotoUrl(tutor.getPhotoUrl());
        r.setActive(user.isActive());
        r.setCourseCount(courseRepository.countByTutorId(tutor.getId()));
        return r;
    }
}