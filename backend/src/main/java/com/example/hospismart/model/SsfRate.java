package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "ssf_Rate")
@NoArgsConstructor
@AllArgsConstructor
public class SsfRate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    @Column(unique = true)
    private String serviceCode;
    private String serviceName;
    private double standardRate;
    private double ssfPrescribedRate;
}
