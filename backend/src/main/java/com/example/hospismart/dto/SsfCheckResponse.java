package com.example.hospismart.dto;

public record SsfCheckResponse (
        boolean eligible,
        String message,
        double hospitalFee,
        double ssfApprovedRate,
        double ssfCovers,
        double finalPatientAmount


        ) {}



