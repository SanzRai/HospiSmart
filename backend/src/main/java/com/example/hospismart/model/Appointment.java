package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private String symptoms;
    private String doctorName;
    private String department;
    private Long departmentId;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String tokenNumber;
    private String status;
    private String date;
    private String time;

    private Long doctorId;


    private String paymentStatus;
    private Double consultingFee;
    private Double coveredAmount;
    private Double payableAmount;
    private Double paidAmount;
    private String paymentMethod;

    private String paymentType;
    private String ssfNumber;
    private String insuranceProvider;
    private String insurancePolicyNumber;
    private String staffId;

    @Column(name = "verified_staff_name")
    private String verifiedStaffName;

    private String bloodPressure;
    private String pulse;
    private String temperature;
    private String weight;
    private String spo2;
    private String respiratoryRate;

    @Column(name = "vitals_recorded")
    private boolean vitalsRecorded = false;

    @Column(name = "recorded_by")
    private String recordedBy;

    private String cancellationReason;

}
