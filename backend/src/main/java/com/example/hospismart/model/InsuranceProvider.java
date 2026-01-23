package com.example.hospismart.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;


import java.util.HashMap;
import java.util.Map;

@Data
@Entity
@Table(name = "insurance_provider")
public class InsuranceProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @JsonProperty("isActive")
    private boolean isActive = true;

    @Convert(converter = CoverageConverter.class)
    private Map<String, Integer> coverage;


}