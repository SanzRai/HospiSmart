package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table (name ="doctors", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email")
})
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    private String name;
    private Long departmentId;
    private String qualifications;
    private int consultationFee;
    private String availableDays;
    private String startTime;
    private String endTime;
    private int slotDurationMinutes;

    private String email;
    private String password;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "is_available")
    private Boolean isAvailable = false;

    @Transient
    private String departmentName;
}
