package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "discharge_summaries")
public class DischargeSummary {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ipdPatientId;
    private String patientName;
    private String uhid;
    private String consultantInCharge;

    private LocalDate dischargeDate = LocalDate.now();

    @Column(columnDefinition = "TEXT")
    private String finalDiagnosis;

    @Column(columnDefinition = "TEXT")
    private String courseInHospital;

    @Column(columnDefinition = "TEXT")
    private String treatmentGiven;

    @Column(columnDefinition = "TEXT")
    private String adviceOnDischarge;

    private String followUp;
}