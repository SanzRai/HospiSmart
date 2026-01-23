package com.example.hospismart.controller;

import com.example.hospismart.model.InsuranceProvider;
import com.example.hospismart.model.Patient;
import com.example.hospismart.model.PatientInsurance;
import com.example.hospismart.repository.InsuranceProviderRepository;
import com.example.hospismart.repository.PatientInsuranceRepository;
import com.example.hospismart.repository.PatientRepository;
import com.example.hospismart.service.InsuranceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/insurance")
@CrossOrigin(origins = "http://localhost:3000")
public class InsuranceController {

    @Autowired
    private InsuranceService insuranceService;

    @Autowired
    private InsuranceProviderRepository providerRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PatientInsuranceRepository patientInsuranceRepository;

    @GetMapping("/eligible")
    public ResponseEntity<?> getEligibleInsurance(
            @RequestParam Long patientId,
            @RequestParam String serviceType
    ) {
        var insurance = insuranceService.getEligibleInsurance(patientId, serviceType);
        if (insurance == null) {
            return ResponseEntity.ok(Map.of("eligible", false));
        }
        int coverage = insurance.getProvider().getCoverage().getOrDefault(serviceType, 0);
        return ResponseEntity.ok(Map.of(
                "eligible", true,
                "coveragePercentage", coverage,
                "providerName", insurance.getProvider().getName(),
                "policyNumber", insurance.getPolicyNumber()
        ));
    }

    @GetMapping("/providers")
    public ResponseEntity<List<InsuranceProvider>> getAllProviders() {
        return ResponseEntity.ok(providerRepository.findAll());
    }

    @PostMapping("/verify-patient")
    public ResponseEntity<?> verifyPatientInsurance(@RequestBody Map<String, Object> payload) {
        try {
            Long patientId = Long.valueOf(payload.get("patientId").toString());
            Long providerId = Long.valueOf(payload.get("providerId").toString());
            String policyNumber = (String) payload.get("policyNumber");

            Double policyLimit = null;
            if (payload.get("policyLimit") != null && !payload.get("policyLimit").toString().isEmpty()) {
                policyLimit = Double.valueOf(payload.get("policyLimit").toString());
            }

            Patient patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));

            InsuranceProvider provider = providerRepository.findById(providerId)
                    .orElseThrow(() -> new RuntimeException("Provider not found"));

            PatientInsurance pi = new PatientInsurance();
            pi.setPatient(patient);
            pi.setProvider(provider);
            pi.setPolicyNumber(policyNumber);
            pi.setValidFrom(LocalDate.now());
            pi.setValidTo(LocalDate.now().plusYears(1));
            pi.setActive(true);

            patientInsuranceRepository.save(pi);

            patient.setInsuranceProvider(provider.getName()); 
            patient.setInsuranceProviderId(provider.getId());
            patient.setInsurancePolicyNumber(policyNumber);
            patient.setInsurancePolicyLimit(policyLimit);
            patient.setInsuranceVerified(true);
            patient.setInsuranceVerifiedBy((String) payload.get("verifiedBy"));

            patientRepository.save(patient);

            return ResponseEntity.ok(Map.of("message", "insurance verified and saved to Patient Insurance record"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Verification failed: " + e.getMessage()));
        }
    }
}