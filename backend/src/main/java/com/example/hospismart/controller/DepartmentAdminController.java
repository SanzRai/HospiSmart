package com.example.hospismart.controller;

import com.example.hospismart.model.Department;
import com.example.hospismart.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/departments")
@CrossOrigin(origins = "http://localhost:3000")
public class DepartmentAdminController extends AdminBaseController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");
        List<Department> list = departmentRepository.findAll();
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    @RequestBody Department dept) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");
        Department saved = departmentRepository.save(dept);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    @PathVariable Long id, @RequestBody Department dept) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");
        return departmentRepository.findById(id).map(existing -> {
            existing.setName(dept.getName());
            existing.setDescription(dept.getDescription());
            departmentRepository.save(existing);
            return ResponseEntity.ok(existing);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    @PathVariable Long id) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");
        departmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
