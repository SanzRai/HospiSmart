package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ipd_patients")
@Data
public class IpdPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private String uhid;
    private String patientName;
    private String ward;
    private String bedNumber;

    private LocalDate admissionDate = LocalDate.now();

    @Column(nullable = false)
    private String status = "ADMITTED";

    private double runningBill = 0.0;
    private double depositBalance = 0.0;

    @ElementCollection
    private List<String> charges = new ArrayList<>();

}