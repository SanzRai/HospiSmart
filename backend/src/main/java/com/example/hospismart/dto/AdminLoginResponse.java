package com.example.hospismart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor

public class AdminLoginResponse {
    private String token;
    private Long adminId;
    private String message;
}
