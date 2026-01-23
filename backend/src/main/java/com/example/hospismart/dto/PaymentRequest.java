package com.example.hospismart.dto;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class PaymentRequest {
    private String bookingType;
    private String bookingToken;
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String phoneNumber;
    private String symptoms;

    private String doctorName;
    private Long doctorId;
    private String department;
    private String appointmentDate;
    private String appointmentTime;

    private Double consultingFee;
    private Double coveredAmount;
    private Double payableAmount;

    private String paymentType;
    private String paymentMethod;

    private String ssfNumber;
    private String insuranceProvider;
    private String insurancePolicyNumber;

    private String staffId;
    private Integer staffDiscountPercent;
    @Column(name = "verified_staff_name")
    private String verifiedStaffName;


}
