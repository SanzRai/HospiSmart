package com.example.hospismart.controller;

import com.example.hospismart.model.Staff;
import com.example.hospismart.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:3000")
public class StaffDiscountController {

    @Autowired
    private StaffRepository staffRepository;

    private static final Map<String, Integer> DISCOUNT_RULES = Map.ofEntries(
            Map.entry("Doctor", 100),
            Map.entry("Nurse", 80),
            Map.entry("Lab Technician", 70),
            Map.entry("Radiologist / X-ray Tech", 70),
            Map.entry("Pharmacist", 70),
            Map.entry("Receptionist", 50),
            Map.entry("Accountant", 50),
            Map.entry("Admin Staff", 50),
            Map.entry("OT Technician", 60),
            Map.entry("Physiotherapist", 60),
            Map.entry("Ward Boy / Aaya", 50),
            Map.entry("Housekeeping", 40),
            Map.entry("Security", 40),
            Map.entry("Driver", 40),
            Map.entry("Ambulance Staff", 50),
            Map.entry("Billing Staff", 50)
    );

    @PostMapping("/verify-discount")
    public ResponseEntity<?> verifyStaffDiscount(@RequestBody VerifyStaffRequest request) {
        String empId = request.getEmployeeId().trim().toUpperCase();
        String patientName = request.getPatientName() !=null ? request.getPatientName().trim() : "";


        Optional<Staff> staffOptional = staffRepository.findByEmployeeIdAndIsActiveTrue(empId);

        if (staffOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid or inactive Employee ID"
            ));
        }
        Staff staff = staffOptional.get();
        String staffName = staff.getName().trim();
        String role = staff.getRole();
        int discount = DISCOUNT_RULES.getOrDefault(role, 30);

        if (!patientName.isEmpty()) {
            String patientLower = patientName.toLowerCase();
            String staffLower = staffName.toLowerCase();
            String staffFirstName = staffName.split(" ")[0].toLowerCase();

            boolean isSamePerson = patientLower.equals(staffLower);

            if (!isSamePerson) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Staff discount only available for " + staffName
                ));
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "staff", Map.of(
                        "name", staff.getName(),
                        "employeeId", staff.getEmployeeId(),
                        "role", role,
                        "department", staff.getDepartment() != null ? staff.getDepartment() : ""
                ),
                "discountPercentage", discount,
                "message", "Staff verified." + discount + "%discount applied."
        ));
    }

    public static class VerifyStaffRequest {
        private String employeeId;
        private String patientName;

        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
    }




}
