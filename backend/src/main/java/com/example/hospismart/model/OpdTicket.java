package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "opd-tickets")
public class OpdTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String name;
    private String email;
    private String phone;
    private Integer age;
    private String symptoms;
    private String ticketNumber;
    private String status = "ISSUED";
    private String assignedDepartment;
    private String assignedDoctor;

    private Long patientId;
    private Long departmentId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    private String cancellationReason;
    private String paymentStatus;

    private LocalDateTime completedAt;

    public String getPatientName() {
        return this.name;
    }

    public Long getAssignedDoctorId() {
        return this.assignedDoctorId;
    }

    private Long assignedDoctorId;



}

