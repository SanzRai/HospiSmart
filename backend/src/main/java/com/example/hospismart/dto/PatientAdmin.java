package com.example.hospismart.dto;

import java.time.Instant;

public record PatientAdmin (
        Long id,
        String name,
        String email,
        String phoneNumber,
        String gender,
        String ssfNumber,
        String insuranceProvider,
        boolean isActive,
        boolean isBlacklisted,
        String blacklistReason,
        String internalNote,
        int totalVisits,
        Instant createdAt,
        String lastModifiedBy,
        Instant lastModifiedAt
) {

}
