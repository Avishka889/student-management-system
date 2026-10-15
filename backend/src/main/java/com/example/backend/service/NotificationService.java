package com.example.backend.service;

import com.example.backend.dto.response.NotificationResponse;
import com.example.backend.entity.Notification;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ---------- creating notifications (used by other services) ----------

    public void notify(User user, String message, String link) {
        if (user == null) return;
        Notification n = new Notification();
        n.setUser(user);
        n.setMessage(message.length() > 500 ? message.substring(0, 497) + "..." : message);
        n.setLink(link);
        notificationRepository.save(n);
    }

    public void notifyAdmins(String message, String link) {
        userRepository.findByRole(Role.ADMIN).forEach(admin -> notify(admin, message, link));
    }

    // ---------- reading / updating my notifications ----------

    public List<NotificationResponse> myNotifications(String username) {
        User user = findUser(username);
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public long unreadCount(String username) {
        return notificationRepository.countByUserIdAndSeenFalse(findUser(username).getId());
    }

    @Transactional
    public void markRead(String username, Long id) {
        User user = findUser(username);
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("This notification does not belong to you");
        }
        n.setSeen(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(String username) {
        User user = findUser(username);
        List<Notification> unread = notificationRepository.findByUserIdAndSeenFalse(user.getId());
        unread.forEach(n -> n.setSeen(true));
        notificationRepository.saveAll(unread);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId());
        r.setMessage(n.getMessage());
        r.setLink(n.getLink());
        r.setSeen(n.isSeen());
        r.setCreatedAt(n.getCreatedAt());
        return r;
    }
}
