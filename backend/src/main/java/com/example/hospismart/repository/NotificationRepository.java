package com.example.hospismart.repository;

import com.example.hospismart.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}