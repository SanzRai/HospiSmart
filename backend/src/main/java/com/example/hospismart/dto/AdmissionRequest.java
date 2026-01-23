package com.example.hospismart.dto;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "admission_requests")
public class AdmissionRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private Long patientId;
    private String patientName;

    private String doctorName;
    private String admissionReason;
    private String requestedWard;
    private String priority;

    private String status;

    private LocalDateTime requestDate = LocalDateTime.now();

}
