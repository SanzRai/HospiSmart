package com.example.hospismart.controller;


import com.example.hospismart.model.Patient;
import com.example.hospismart.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:3000")

public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private String generateUniqueUhid() {
        List<Patient> allPatients = patientRepository.findAll();
        long nextNumber = 1;

        if (!allPatients.isEmpty()) {
            nextNumber = allPatients.stream()
                    .map(Patient::getUhid)
                    .filter(uhid -> uhid != null && uhid.startsWith("HS-"))
                    .map(uhid -> uhid.substring(3))
                    .mapToLong(Long::parseLong)
                    .max()
                    .orElse(0) + 1;
        }

        return String.format("HS-%06d", nextNumber);
    }
    @PostMapping("/register")
    public ResponseEntity<?> registerPatient(@RequestBody Patient patient) {
        if (patientRepository.findByPhoneNumber(patient.getPhoneNumber()).isPresent()) {
            return ResponseEntity.badRequest().body("Phone number is already registered!");
        }

        if (patient.getUhid() == null || patient.getUhid().isEmpty()) {
            String newUhid = generateUniqueUhid();
            patient.setUhid(newUhid);
        }

        if (patient.getPassword() != null && !patient.getPassword().isEmpty()) {
            patient.setPassword(passwordEncoder.encode(patient.getPassword()));
        } else {
            patient.setPassword(passwordEncoder.encode(patient.getPhoneNumber()));
        }

        patient.setCreatedAt(Instant.now());

        try {
            Patient savedPatient = patientRepository.save(patient);
            return ResponseEntity.ok(savedPatient);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to register patient: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Patient> getPatients(@RequestParam(required = false) Boolean insured) {
        List<Patient> allPatients = patientRepository.findAll();

        if (insured != null && insured) {
            return allPatients.stream()
                    .filter(p ->
                            (p.getInsuranceProvider() != null && !p.getInsuranceProvider().isEmpty()) ||
                                    (p.getInsurancePolicyNumber() != null && !p.getInsurancePolicyNumber().isEmpty())
                    )
                    .collect(Collectors.toList());
        }
        return allPatients;
    }
    @GetMapping("/search")
    public ResponseEntity<?> searchPatient(@RequestParam("phone") String phoneNumber) {
        Optional<Patient> patient = patientRepository.findByPhoneNumber(phoneNumber);

        if (patient.isPresent()) {
            return ResponseEntity.ok(patient.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(
            @PathVariable Long id,
            @RequestBody Patient updatedPatient) {

        return patientRepository.findById(id)
                .map(existing -> {
                    if (updatedPatient.getFullName() != null) {
                        existing.setFullName(updatedPatient.getFullName());
                    }
                    if (updatedPatient.getEmail() != null) {
                        existing.setEmail(updatedPatient.getEmail());
                    }
                    if (updatedPatient.getPhoneNumber() != null) {
                        existing.setPhoneNumber(updatedPatient.getPhoneNumber());
                    }
                    if (updatedPatient.getDateOfBirth() != null) {
                        existing.setDateOfBirth(updatedPatient.getDateOfBirth());
                    }
                    if (updatedPatient.getGender() != null) {
                        existing.setGender(updatedPatient.getGender());
                    }
                    if (updatedPatient.getAddress() != null) {
                        existing.setAddress(updatedPatient.getAddress());
                    }
                    if (updatedPatient.getEmergencyContact() != null) {
                        existing.setEmergencyContact(updatedPatient.getEmergencyContact());
                    }
                    if (updatedPatient.getAllergies() != null) {
                        existing.setAllergies(updatedPatient.getAllergies());
                    }
                    if (updatedPatient.getConditions() != null) {
                        existing.setConditions(updatedPatient.getConditions());
                    }

                    existing.setLastModifiedAt(Instant.now());

                    Patient saved = patientRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/insured")
    public ResponseEntity<List<Patient>> getAllInsuredPatients() {
        List<Patient> insured = patientRepository.findByInsuranceProviderIdIsNotNull();
        return ResponseEntity.ok(insured);
    }
}
