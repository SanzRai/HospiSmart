package com.example.hospismart.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "ssf_contributor")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SsfContributor {

    @Id
    private String ssfId;

    private boolean eligible;
    private double remainingOpdBalance;
    private double remainingIpdBalance;



}