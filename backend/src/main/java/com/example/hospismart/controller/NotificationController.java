package com.example.hospismart.controller;

import com.example.hospismart.model.Notification;
import com.example.hospismart.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Notification>> getPatientNotifications(@PathVariable Long patientId) {
        List<Notification> notifications = notificationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/patient/{patientId}/read-all")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long patientId) {
        List<Notification> notifications = notificationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok().build();
    }
}