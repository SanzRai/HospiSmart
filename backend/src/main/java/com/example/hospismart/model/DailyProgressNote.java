package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ipd_progress_notes")
public class DailyProgressNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ipdPatientId;
    private String doctorName;
    private LocalDateTime roundTime = LocalDateTime.now();

    // Vitals
    private String bp;
    private String pulse;
    private String temp;
    private String spo2;

    @Column(columnDefinition = "TEXT")
    private String progressNote;
}