package com.example.hospismart.controller;

import com.example.hospismart.model.Prescription;
import com.example.hospismart.repository.PrescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "http://localhost:3000")
public class PrescriptionController {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getPatientPrescriptions(@PathVariable Long patientId) {
        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientId);
        return ResponseEntity.ok(prescriptions);
    }
}
