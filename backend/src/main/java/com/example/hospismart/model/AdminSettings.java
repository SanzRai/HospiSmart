package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Hospital Profile
    private String hospitalName;
    private String tagline;
    private String address;
    private String phone;
    private String emergencyNo;
    private String email;
    private String gstin;
    private String licenseNo;

    // Billing & Tax
    private Double gstRate;
    private String opdPrefix;
    private String ipdPrefix;
    private String pharmacyPrefix;

    // Appointments
    private Integer defaultSlotMinutes;
    private Integer maxBookingsPerSlot;
    private Boolean onlineBookingAllowed;

    // Notifications
    private Boolean notifyEmail;
    private Boolean notifySms;
    private Boolean notifyWhatsapp;
}
