package com.example.hospismart.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AdminSettingsDTO {

    private String hospitalName;
    private String tagline;
    private String address;
    private String phone;
    private String emergencyNo;
    private String email;
    private String gstin;
    private String licenseNo;

    private Double gstRate;
    private String opdPrefix;
    private String ipdPrefix;
    private String pharmacyPrefix;

    private Integer defaultSlotMinutes;
    private Integer maxBookingsPerSlot;
    private Boolean onlineBookingAllowed;

    private Notifications notifications = new Notifications();

    @Data
    public static class Notifications {
        private Boolean email;
        private Boolean sms;
        private Boolean whatsapp;
    }
}