package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "prescriptions")
public class Prescription {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long appointmentId;

    private LocalDateTime visitDate = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String advice;

    private String outcome;
    private Integer followUpDays;
    private String admissionWard;

    @ElementCollection
    private List<MedicineItem> medicines = new ArrayList<>();

    @ElementCollection
    private List<String> labTests = new ArrayList<>();

    @Embeddable
    @Data
    public static class MedicineItem {
        private String name;
        private String dosage;
        private String duration;
        private String instruction;
    }
}