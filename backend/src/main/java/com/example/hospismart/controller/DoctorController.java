package com.example.hospismart.controller;

import com.example.hospismart.model.Doctor;
import com.example.hospismart.repository.DepartmentRepository;
import com.example.hospismart.repository.DoctorRepository;
import com.example.hospismart.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:3000")
public class DoctorController {
    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<Doctor> docOpt = doctorRepository.findByEmail(request.getEmail());

        if (docOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), docOpt.get().getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email or password"));
        }

        Doctor doctor = docOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), doctor.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid email or password"));
        }

        if (!doctor.isActive()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account is inactive. Contact admin."));
        }

        String token = jwtUtil.generateDoctorToken(doctor);

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", doctor.getId());
        userData.put("name", doctor.getName());
        userData.put("email", doctor.getEmail());
        userData.put("departmentId", doctor.getDepartmentId());
        userData.put("qualifications", doctor.getQualifications());
        userData.put("consultationFee", doctor.getConsultationFee());
        userData.put("availableDays", doctor.getAvailableDays());
        userData.put("startTime", doctor.getStartTime());
        userData.put("endTime", doctor.getEndTime());
        userData.put("slotDurationMinutes", doctor.getSlotDurationMinutes());


        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Login successful",
                "token", token,
                "role", "DOCTOR",
                "userId", doctor.getId(),
                "doctor", userData
        ));
    }



    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll().stream().map(doc -> {
            departmentRepository.findById(doc.getDepartmentId()).ifPresent(dept -> doc.setDepartmentName(dept.getName()));
            return doc;
        }).collect(Collectors.toList());
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<?> getDoctorsByDepartment(@PathVariable Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            return ResponseEntity.notFound().build();
        }

        List<Doctor> doctors = doctorRepository.findByDepartmentId(departmentId);
        List<Map<String, Object>> result = doctors.stream()
                .filter(Doctor::isActive)
                .map(d -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId());
                    map.put("name", d.getName());
                    map.put("consultationFee", d.getConsultationFee());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        return doctorRepository.findById(id).map(doc -> {
            doc.setIsAvailable(payload.get("isAvailable"));
            doctorRepository.save(doc);
            return ResponseEntity.ok(doc);
        }).orElse(ResponseEntity.notFound().build());
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        if (request.getId() == null || request.getOldPassword() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        Optional<Doctor> doctorOpt = doctorRepository.findById(request.getId());
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Doctor doctor = doctorOpt.get();

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), doctor.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
        }

        // Update password
        doctor.setPassword(passwordEncoder.encode(request.getNewPassword()));
        doctorRepository.save(doctor);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDoctorProfile(@PathVariable Long id, @RequestBody DoctorUpdateRequest request) {
        Optional<Doctor> doctorOpt = doctorRepository.findById(id);
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Doctor doctor = doctorOpt.get();

        if (request.getQualifications() != null) {
            doctor.setQualifications(request.getQualifications());
        }
        if (request.getAvailableDays() != null) {
            doctor.setAvailableDays(request.getAvailableDays());
        }
        if (request.getStartTime() != null) {
            doctor.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            doctor.setEndTime(request.getEndTime());
        }
        if (request.getConsultationFee() != null) {
            doctor.setConsultationFee(request.getConsultationFee());
        }

        doctorRepository.save(doctor);

        Map<String, Object> updatedData = new HashMap<>();
        updatedData.put("id", doctor.getId());
        updatedData.put("name", doctor.getName());
        updatedData.put("email", doctor.getEmail());
        updatedData.put("departmentId", doctor.getDepartmentId());
        updatedData.put("qualifications", doctor.getQualifications());
        updatedData.put("consultationFee", doctor.getConsultationFee());
        updatedData.put("availableDays", doctor.getAvailableDays());
        updatedData.put("startTime", doctor.getStartTime());
        updatedData.put("endTime", doctor.getEndTime());
        updatedData.put("slotDurationMinutes", doctor.getSlotDurationMinutes());

        return ResponseEntity.ok(updatedData);
    }



    public static class ChangePasswordRequest {
        private Long id;
        private String oldPassword;
        private String newPassword;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class DoctorUpdateRequest {
        private String qualifications;
        private String availableDays;
        private String startTime;
        private String endTime;
        private Integer consultationFee;

        public String getQualifications() { return qualifications; }
        public void setQualifications(String qualifications) { this.qualifications = qualifications; }
        public String getAvailableDays() { return availableDays; }
        public void setAvailableDays(String availableDays) { this.availableDays = availableDays; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public Integer getConsultationFee() { return consultationFee; }
        public void setConsultationFee(Integer consultationFee) { this.consultationFee = consultationFee; }
    }

}