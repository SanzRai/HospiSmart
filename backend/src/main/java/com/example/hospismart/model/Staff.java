package com.example.hospismart.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "staff", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email")
})
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @Column(unique = true, nullable = false)
    private String employeeId;
    private String name;
    private String email;
    private String phone;

    private String role;
    private String department;
    private String designation;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "citizenship_no")
    private String citizenshipNo;
    private String address;
    private String username;
    private String password;


    @Column(name = "is_active")
    @JsonProperty("isActive")
    private boolean isActive = true;
    @Column(name = "created_at")
    private Instant createdAt = Instant.now();



}
