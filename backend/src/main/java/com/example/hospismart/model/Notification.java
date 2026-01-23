package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;

    private String title;
    private String message;
    private String type;

    @Column(name = "is_read")
    private boolean isRead = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}