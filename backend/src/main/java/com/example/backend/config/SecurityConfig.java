package com.example.backend.config;

import com.example.backend.entity.Role;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtAuthFilter;
import com.example.backend.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig implements CommandLineRunner {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserRepository userRepository;
    private final StudentService studentService;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // show the real error (404/500...) instead of a blank 403
                .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/students/me", "/api/students/me/**").authenticated()
                .requestMatchers("/api/students/**").hasRole("ADMIN")
                .requestMatchers("/api/tutors/me/**").hasRole("TUTOR")
                .requestMatchers(HttpMethod.GET, "/api/lectures/**").authenticated()
                .requestMatchers("/api/lectures/*/complete").hasRole("STUDENT")
                .requestMatchers("/api/lectures/**").hasRole("TUTOR")
                .requestMatchers("/api/enrollments/me", "/api/enrollments/request/**").hasRole("STUDENT")
                .requestMatchers(HttpMethod.DELETE, "/api/enrollments/*").hasRole("STUDENT")
                .requestMatchers("/api/enrollments/**").hasRole("ADMIN")
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/tutors/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/courses/**").authenticated()
                .requestMatchers("/api/courses/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ---- startup student sync (formerly StudentSyncRunner) ----
    @Override
    public void run(String... args) {
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .forEach(studentService::ensureStudentRecord);

        // students who already had a course get an APPROVED enrollment record
        studentService.backfillEnrollments();
    }
}