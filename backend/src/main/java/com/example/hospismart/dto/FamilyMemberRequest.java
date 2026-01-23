package com.example.hospismart.dto;

import lombok.Data;

@Data
public class FamilyMemberRequest {
    private String name;
    private String relation;
    private String phone;
    private Long primaryPatientId;
}