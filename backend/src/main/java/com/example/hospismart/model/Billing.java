package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "billing")
@Data
public class Billing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private Long patientId;

    @Column(unique = true)
    private String receiptId;

    private String patientName;
    private String patientPhone;
    private String patientEmail;

    private String paymentType;

    private String department;
    private String serviceCode;
    private String serviceName;

    private double originalAmount;
    private double discountAmount;
    private String discountType;
    private String discountDetails;

    private double finalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime paymentDate;

    private String tokenNumber;
    private String ssfId;
    private String insurancePolicy;
    private String staffId;

    private LocalDateTime createdAt = LocalDateTime.now();
}