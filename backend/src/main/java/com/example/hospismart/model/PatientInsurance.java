package com.example.hospismart.model;


import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "patient_insurance")
public class PatientInsurance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id")
    private InsuranceProvider provider;

    private String policyNumber;
    private LocalDate validFrom;
    private LocalDate validTo;
    private boolean isActive = true;
}
