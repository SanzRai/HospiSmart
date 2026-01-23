package com.example.hospismart.dto;

import lombok.Data;

@Data
public class PatientBillPaymentRequest {
    private Long patientId;
    private String bookingType;
    private String bookingToken;
    private String patientName;
    private String patientPhone;
    private String patientEmail;
    private String department;
    private String doctorName;
    private String date;
    private String time;
    private double amount;
    private String paymentMethod;
    private String paymentType;
    private double payableAmount;
    private double coveredAmount;
    private String ssfNumber;
    private String insuranceProvider;
}