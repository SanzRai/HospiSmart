package com.example.hospismart.controller;

import com.example.hospismart.dto.AdmissionRequest;
import com.example.hospismart.model.Bed;
import com.example.hospismart.model.IpdPatient;
import com.example.hospismart.repository.AdmissionRespository;
import com.example.hospismart.repository.BedRepository;
import com.example.hospismart.repository.IpdPatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/admissions")
@CrossOrigin(origins = "http://localhost:3000")
public class AdmissionController {
    @Autowired
    private AdmissionRespository admissionRespository;

    @Autowired
    private BedRepository bedRepository;

    @Autowired
    private IpdPatientRepository ipdPatientRepository;

    private static final AtomicLong uhidCounter = new AtomicLong(0);
    private static final DateTimeFormatter UHID_FORMAT = DateTimeFormatter.ofPattern("yyyy");

    @GetMapping("/pending")
    public List<AdmissionRequest> getPendingAdmissions() {
        return admissionRespository.findByStatus("PENDING");
    }

    @PostMapping("/request")
    public ResponseEntity<?> createRequest(@RequestBody AdmissionRequest request) {
        request.setStatus("PENDING");
        request.setRequestDate(LocalDateTime.now());
        AdmissionRequest saved = admissionRespository.save(request);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/admit")
    public ResponseEntity<?> admitPatient(@RequestBody Map<String, Object> payload) {
        try {
            Long requestId = Long.valueOf(payload.get("requestId").toString());
            Long bedId = Long.valueOf(payload.get("bedId").toString());
            String admittedBy = (String) payload.get("admittedBy");

            AdmissionRequest request = admissionRespository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Request not found"));

            if (!"PENDING".equals(request.getStatus())) {
                return ResponseEntity.badRequest().body("This patient is already admitted or cancelled.");
            }

            Bed bed = bedRepository.findById(bedId)
                    .orElseThrow(() -> new RuntimeException("Bed not found"));

            if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
                return ResponseEntity.badRequest().body("Selected bed is not available.");
            }

            bed.setStatus("OCCUPIED");
            bed.setCurrentPatientId(request.getPatientId());
            bed.setCurrentPatientName(request.getPatientName());
            bed.setAdmissionDate(LocalDate.now().toString());
            bedRepository.save(bed);

            String uhid = generateUHID();

            IpdPatient ipdPatient = new IpdPatient();
            ipdPatient.setPatientId(request.getPatientId());
            ipdPatient.setPatientName(request.getPatientName());
            ipdPatient.setUhid("UHID-" + request.getPatientId()); 
            ipdPatient.setWard(bed.getWard());
            ipdPatient.setBedNumber(bed.getBedNumber());
            ipdPatient.setAdmissionDate(LocalDate.now());
            ipdPatientRepository.save(ipdPatient);

            request.setStatus("ADMITTED");
            admissionRespository.save(request);

            return ResponseEntity.ok(Map.of(
                    "message", "Patient admitted successfully!",
                    "uhid", uhid,
                    "bed", bed.getBedNumber() + " (" + bed.getWard() + ")"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectAdmission(@PathVariable Long requestId, @RequestBody Map<String, String> payload) {
        String reason = payload.get("reason");
        return admissionRespository.findById(requestId).map(req -> {
            if (!"PENDING".equals(req.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Request already processed."));
            }
            req.setStatus("REJECTED");
            admissionRespository.save(req);
            return ResponseEntity.ok(Map.of("message", "Admission request rejected." + (reason != null ? " Reason: " + reason : "")));
        }).orElse(ResponseEntity.notFound().build());
    }

    private String generateUHID() {
        long next = uhidCounter.incrementAndGet();
        String year = LocalDate.now().format(UHID_FORMAT);
        return String.format("HS-%s-%04d", year, next);
    }
}
