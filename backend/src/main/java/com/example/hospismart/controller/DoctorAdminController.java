package com.example.hospismart.controller;

import com.example.hospismart.model.Department;
import com.example.hospismart.model.Doctor;
import com.example.hospismart.repository.DepartmentRepository;
import com.example.hospismart.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/doctors")
@CrossOrigin(origins = "http://localhost:3000")
public class DoctorAdminController extends AdminBaseController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");

        List<Doctor> docs = doctorRepository.findAll();
        List<Map<String, Object>> result = docs.stream().map(d -> {
            String deptName = d.getDepartmentId() != null
                    ? departmentRepository.findById(d.getDepartmentId())
                    .map(Department::getName)
                    .orElse("Unknown")
                    : "N/A";

            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("name", d.getName());
            map.put("departmentId", d.getDepartmentId());
            map.put("departmentName", deptName);
            map.put("qualifications", d.getQualifications());
            map.put("consultationFee", d.getConsultationFee());
            map.put("availableDays", d.getAvailableDays());
            map.put("startTime", d.getStartTime());
            map.put("endTime", d.getEndTime());
            map.put("slotDurationMinutes", d.getSlotDurationMinutes());
            map.put("isActive", d.isActive());
            map.put("email", d.getEmail() != null ? d.getEmail() : "");  // FIXED: Inside the map!
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    @RequestBody Doctor doctor) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");

        if (doctor.getPassword() != null && !doctor.getPassword().isEmpty()) {
            doctor.setPassword(passwordEncoder.encode(doctor.getPassword()));
        }
        Doctor saved = doctorRepository.save(doctor);
        saved.setPassword(null);  // Never return password
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    @PathVariable Long id, @RequestBody Doctor doc) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");

        return doctorRepository.findById(id).map(existing -> {
            existing.setName(doc.getName());
            existing.setDepartmentId(doc.getDepartmentId());
            existing.setQualifications(doc.getQualifications());
            existing.setConsultationFee(doc.getConsultationFee());
            existing.setAvailableDays(doc.getAvailableDays());
            existing.setStartTime(doc.getStartTime());
            existing.setEndTime(doc.getEndTime());
            existing.setSlotDurationMinutes(doc.getSlotDurationMinutes());
            existing.setEmail(doc.getEmail());
            existing.setActive(doc.isActive());

            if (doc.getPassword() != null && !doc.getPassword().trim().isEmpty()) {
                existing.setPassword(passwordEncoder.encode(doc.getPassword()));
            }

            Doctor updated = doctorRepository.save(existing);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    @PathVariable Long id) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");
        doctorRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                          @PathVariable Long id, @RequestBody StatusToggleRequest body) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");

        return doctorRepository.findById(id).map(d -> {
            d.setActive(body.isActive);
            doctorRepository.save(d);
            return ResponseEntity.ok(d);
        }).orElse(ResponseEntity.notFound().build());
    }

    public static class StatusToggleRequest {
        public boolean isActive;
    }
}