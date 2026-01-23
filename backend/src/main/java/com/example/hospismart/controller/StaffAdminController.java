package com.example.hospismart.controller;

import com.example.hospismart.model.Staff;
import com.example.hospismart.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/staff")
@CrossOrigin(origins = "http://localhost:3000")
public class StaffAdminController extends AdminBaseController {

    @Autowired
    private StaffRepository repo;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader("Authorization") String authHeader) {
        if (!validateAdminTokenHeader(authHeader))
            return ResponseEntity.status(401).body("Unauthorized");

        List<Staff> list = repo.findAll();

        return ResponseEntity.ok()
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(list);
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Staff staff) {

        if (!validateAdminTokenHeader(authHeader))
            return ResponseEntity.status(401).body("Unauthorized");


        if (repo.findByEmployeeId(staff.getEmployeeId()).isPresent()) {
            return ResponseEntity.badRequest().body("Employee ID already exists");
        }

        if (staff.getPassword() != null && !staff.getPassword().trim().isEmpty()) {
            staff.setPassword(passwordEncoder.encode(staff.getPassword().trim()));
        } else {
            staff.setPassword(passwordEncoder.encode("temp123"));
        }

        Staff saved = repo.save(staff);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Staff updatedStaff,
            @RequestHeader("Authorization") String auth) {

        if (!validateAdminTokenHeader(auth))
            return ResponseEntity.status(401).build();

        return repo.findById(id).map(existing -> {
            existing.setEmployeeId(updatedStaff.getEmployeeId());
            existing.setName(updatedStaff.getName());
            existing.setEmail(updatedStaff.getEmail());
            existing.setPhone(updatedStaff.getPhone());
            existing.setRole(updatedStaff.getRole());
            existing.setDepartment(updatedStaff.getDepartment());
            existing.setDesignation(updatedStaff.getDesignation());
            existing.setJoiningDate(updatedStaff.getJoiningDate());
            existing.setCitizenshipNo(updatedStaff.getCitizenshipNo());
            existing.setActive(updatedStaff.isActive());
            existing.setUsername(updatedStaff.getUsername());

            if (updatedStaff.getPassword() != null && !updatedStaff.getPassword().trim().isEmpty()) {
                existing.setPassword(passwordEncoder.encode(updatedStaff.getPassword().trim()));
            }

            Staff saved = repo.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        if (!validateAdminTokenHeader(authHeader))
            return ResponseEntity.status(401).body("Unauthorized");

        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            @RequestHeader("Authorization") String auth) {

        if (!validateAdminTokenHeader(auth)) {
            return ResponseEntity.status(401).build();
        }

        return repo.findById(id).map(staff -> {
            Boolean newStatus = body.get("isActive");
            staff.setActive(newStatus != null ? newStatus : true);
            repo.save(staff);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}