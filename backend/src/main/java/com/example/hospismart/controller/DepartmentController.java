package com.example.hospismart.controller;

import com.example.hospismart.model.Department;
import com.example.hospismart.model.Doctor;
import com.example.hospismart.repository.DepartmentRepository;
import com.example.hospismart.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "http://localhost:3000")
public class DepartmentController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @GetMapping
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @GetMapping("/{id}/doctors")
    public ResponseEntity<?> getDoctorsByDepartment(@PathVariable Long id) {
        if (!departmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        List<Doctor> doctors = doctorRepository.findByDepartmentId(id);

        List<Map<String, Object>> result = doctors.stream()
                .filter(Doctor::isActive)
                .filter(d -> Boolean.TRUE.equals(d.getIsAvailable()))
                .map(d -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId());
                    map.put("name", d.getName());
                    map.put("consultationFee", d.getConsultationFee());
                    map.put("startTime", d.getStartTime());
                    map.put("endTime", d.getEndTime());
                    map.put("isAvailable", d.getIsAvailable());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}