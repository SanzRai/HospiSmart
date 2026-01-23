package com.example.hospismart.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "family_members")
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String relation;
    private String phone;

    @Column(unique = true, nullable = true)
    private String uhid;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_patient_id", nullable = false)
    private Patient primaryPatient;
}