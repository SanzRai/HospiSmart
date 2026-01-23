package com.example.hospismart.controller;

import com.example.hospismart.model.Staff;
import com.example.hospismart.repository.StaffRepository;
import com.example.hospismart.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:3000")
public class StaffController {
    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "Nurse",
            "Receptionist",
            "Lab Technician",
            "Billing Staff"
    );

    @PostMapping("/login")
    public ResponseEntity<?> staffLogin(@RequestBody LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        return staffRepository.findByEmail(email).map(staff -> {
            if (!staff.isActive()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Your account is deactivated. Contact admin."));
            }

            if (!encoder.matches(request.getPassword(), staff.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email or password"));
            }

            String role = staff.getRole();
            if (role == null || !ALLOWED_ROLES.contains(role)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Login not authorized for role: " + role));
            }

            String token = jwtUtil.generateStaffToken(staff);

            Map<String, Object> staffData = new HashMap<>();
            staffData.put("id", staff.getId());
            staffData.put("name", staff.getName());
            staffData.put("employeeId", staff.getEmployeeId());
            staffData.put("role", staff.getRole());
            staffData.put("department", staff.getDepartment() != null ? staff.getDepartment() : "General");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "token", token,
                    "role", "STAFF",
                    "userId", staff.getId(),
                    "staff", staffData
            ));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "Staff not found")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        return staffRepository.findById(id)
                .map(staff -> {
                    staff.setPassword(null); 
                    return ResponseEntity.ok(staff);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Staff updatedStaff) {
        return staffRepository.findById(id).map(staff -> {
            if(updatedStaff.getPhone() != null) staff.setPhone(updatedStaff.getPhone());
            if(updatedStaff.getAddress() != null) staff.setAddress(updatedStaff.getAddress());

            staffRepository.save(staff);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully", "staff", staff));
        }).orElse(ResponseEntity.notFound().build());
    }


    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> payload) {
        Long id = Long.valueOf(payload.get("id").toString());
        String oldPassword = (String) payload.get("oldPassword");
        String newPassword = (String) payload.get("newPassword");

        Optional<Staff> staffOpt = staffRepository.findById(id);
        if(staffOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Staff not found"));

        Staff staff = staffOpt.get();

        if(!encoder.matches(oldPassword, staff.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Incorrect old password"));
        }

        staff.setPassword(encoder.encode(newPassword));
        staffRepository.save(staff);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    public static class LoginRequest {
        private String email;
        private String password;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}