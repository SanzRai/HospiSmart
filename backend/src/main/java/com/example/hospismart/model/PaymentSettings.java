package com.example.hospismart.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "payment_settings")
public class PaymentSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    private Double opdFee = 500.0;
    private Double taxPercentage = 0.0;
    private Double ssfDiscountPercentage = 0.0;
    private Double emergencyFee = 0.0;
}
