package com.example.hospismart.dto;

import lombok.Data;

@Data
public class BillingRequest {
    private String bookingType;
    private String bookingToken;
    private String patientName;
    private String patientPhone;
    private String patientEmail;

    private String department;
    private String doctorName;
    private String appointmentDate;
    private String appointmentTime;

    private double consultingFee;
    private String symptoms;

    private String paymentType;         
    private String ssfNumber;
    private String insuranceProvider;
    private String insurancePolicyNumber;
    private String staffId;

    private double coveredAmount;
    private double payableAmount;
    private String paymentMethod;
}
