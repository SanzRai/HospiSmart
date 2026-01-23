package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "patients")
public class Patient {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String fullName;
        private String email;
        @Column(unique = true, nullable = false)
        private String phoneNumber;
        private String password;
        private String dateOfBirth;
        private String gender;
        @Embedded
        private Address address;
        private String ssfNumber;

        @Column(unique = true, nullable = false)
        private String uhid;
        private String insuranceProvider;
        private Long insuranceProviderId;
        private String insurancePolicyNumber;
        private Double insurancePolicyLimit;
        private boolean insuranceVerified = false;
        private String insuranceVerifiedBy;

        private String emergencyContact;

        private String blacklistReason;
        @Column(name = "is_blacklisted")
        private boolean isBlacklisted = false;
        private String internalNote;
        private int totalVisits = 0;

        private String lastModifiedBy;
        private Instant lastModifiedAt;

        private String allergies;
        private String conditions;


        @Column(name = "is_active")
        private boolean isActive = true;
        private Instant createdAt = Instant.now();

        public Patient() {}


}
