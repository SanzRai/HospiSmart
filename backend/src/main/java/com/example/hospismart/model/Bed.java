package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "beds")
public class Bed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private String ward;
    private String bedNumber;
    private String status;

    private Long currentPatientId;
    private String currentPatientName;
    private String admissionDate;
}
