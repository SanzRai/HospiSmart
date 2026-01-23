package com.example.hospismart.controller;

import com.example.hospismart.dto.PatientAdmin;
import com.example.hospismart.model.Patient;
import com.example.hospismart.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/patients")
@CrossOrigin(origins = "http://localhost:3000")
public class PatientAdminController extends AdminBaseController {

    @Autowired
    private PatientRepository repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<PatientAdmin>> list(@RequestHeader("Authorization") String auth) {
        if (!validateAdminTokenHeader(auth)) {
            return ResponseEntity.status(401).build();
        }

        List<PatientAdmin> patients = repo.findAll().stream()
                .map(p -> new PatientAdmin(
                        p.getId(),
                        p.getFullName(),
                        p.getEmail(),
                        p.getPhoneNumber(),
                        p.getGender(),
                        p.getSsfNumber(),
                        p.getInsuranceProvider(),
                        p.isActive(),
                        p.isBlacklisted(),
                        p.getBlacklistReason(),
                        p.getInternalNote(),
                        p.getTotalVisits(),
                        p.getCreatedAt(),
                        p.getLastModifiedBy(),
                        p.getLastModifiedAt()
                ))
                .toList();

        return ResponseEntity.ok(patients);
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id,
                                          @RequestBody Map<String, Boolean> body,
                                          @RequestHeader("Authorization") String auth) {
        if (!validateAdminTokenHeader(auth)) return ResponseEntity.status(401).build();

        return repo.findById(id).map(p -> {
            Boolean newStatus = body.get("isActive");
            p.setActive(newStatus != null ? newStatus : true);
            p.setLastModifiedBy(getAdminNameFromToken(auth));
            p.setLastModifiedAt(Instant.now());
            repo.save(p);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/blacklist")
    public ResponseEntity<?> blacklist(@PathVariable Long id,
                                       @RequestBody Map<String, String> body,
                                       @RequestHeader("Authorization") String auth) {
        if (!validateAdminTokenHeader(auth)) return ResponseEntity.status(401).build();

        String reason = body.get("reason");

        return repo.findById(id).map(p -> {
            boolean shouldBlacklist = reason != null && !reason.trim().isEmpty();
            p.setBlacklisted(shouldBlacklist);
            p.setBlacklistReason(shouldBlacklist ? reason.trim() : null);
            p.setLastModifiedBy(getAdminNameFromToken(auth));
            p.setLastModifiedAt(Instant.now());
            repo.save(p);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id,
                                           @RequestHeader("Authorization") String auth) {
        if (!validateAdminTokenHeader(auth)) return ResponseEntity.status(401).build();

        return repo.findById(id).map(p -> {
            p.setPassword(passwordEncoder.encode("temp123"));
            repo.save(p);
            return ResponseEntity.ok(Map.of("message", "Password reset to temp123"));
        }).orElse(ResponseEntity.notFound().build());
    }


    private String getAdminNameFromToken(String authHeader) {

        return "admin";
    }
}