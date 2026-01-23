package com.example.hospismart.controller;

import com.example.hospismart.dto.LabTestRequest;
import com.example.hospismart.model.Notification;
import com.example.hospismart.repository.LabRepository;
import com.example.hospismart.repository.NotificationRepository;
import com.example.hospismart.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab")
@CrossOrigin(origins = "http://localhost:3000")
public class LabController {

    @Autowired
    private LabRepository labRepository;
    @Autowired
    QueueWebSocketController queueWebSocketController;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    NotificationService notificationService;

    @GetMapping("/samples/pending")
    public ResponseEntity<?> getPendingSamples() {
        return ResponseEntity.ok(labRepository.findByStatus("PAID"));
    }

    @GetMapping("/results/pending-entry")
    public ResponseEntity<?> getPendingEntry() {
        return ResponseEntity.ok(labRepository.findByStatus("SAMPLE_COLLECTED"));
    }

    @GetMapping("/results/pending-verification")
    public ResponseEntity<?> getPendingVerification() {
        return ResponseEntity.ok(labRepository.findByStatus("RESULT_ENTERED"));
    }

    @PostMapping("/samples/{id}/collect")
    public ResponseEntity<?> collectSample(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return labRepository.findById(id).map(test -> {
            test.setStatus("SAMPLE_COLLECTED");
            test.setCollectedBy(payload.get("collectedBy"));
            test.setCollectionTime(LocalDateTime.now());
            labRepository.save(test);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/results/{id}/submit")
    public ResponseEntity<?> submitResults(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return labRepository.findById(id).map(test -> {

            Object resultsObj = payload.get("results");
            List<Map<String, Object>> resultsList;

            if (resultsObj instanceof List) {
                resultsList = (List<Map<String, Object>>) resultsObj;
            } else {
                return ResponseEntity.badRequest().body("Invalid results format");
            }

            List<LabTestRequest.LabResult> labResults = new ArrayList<>();
            for (Map<String, Object> r : resultsList) {
                String name = (String) r.get("name");
                String value = r.get("value") != null ? r.get("value").toString() : "";
                String unit = r.get("unit") != null ? r.get("unit").toString() : "";
                String normalRange = r.get("normalRange") != null ? r.get("normalRange").toString() : "";

                labResults.add(new LabTestRequest.LabResult(name, value, unit, normalRange));
            }

            test.setResults(labResults);

            test.setEnteredBy((String) payload.get("enteredBy"));
            test.setEntryTime(LocalDateTime.now());
            test.setStatus("RESULT_ENTERED");

            labRepository.save(test);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }



    @PostMapping("/results/{id}/verify")
    public ResponseEntity<?> verifyResults(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return labRepository.findById(id).map(test -> {
            boolean approved = (boolean) payload.get("approved");
            if (approved) {
                test.setStatus("VERIFIED");
                test.setVerifiedBy((String) payload.get("verifiedBy"));
                test.setVerificationTime(LocalDateTime.now());


                notificationService.createInAppNotification(
                        test.getPatient().getId(),
                        "Lab Report Ready",
                        "Your " + test.getTestName() + " results are now available.",
                        "lab_report"
                );

                queueWebSocketController.broadcastQueueUpdate("New lab report ready for patient ID: " + test.getPatient().getId());
            } else {
                test.setStatus("SAMPLE_COLLECTED");
            }
            labRepository.save(test);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}/reports")
    public ResponseEntity<?> getPatientReports(@PathVariable Long patientId) {
        return ResponseEntity.ok(labRepository.findByPatient_IdAndStatus(patientId, "VERIFIED"));
    }

    @GetMapping("/doctor/patient/{patientId}")
    public ResponseEntity<?> getDoctorViewReports(@PathVariable Long patientId) {
        return ResponseEntity.ok(labRepository.findByPatient_Id(patientId));
    }
}