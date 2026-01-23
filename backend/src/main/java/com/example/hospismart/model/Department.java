package com.example.hospismart.model;


import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(length = 1000)
    private String description;

}
