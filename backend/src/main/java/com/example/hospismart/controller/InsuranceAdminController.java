package com.example.hospismart.controller;

import com.example.hospismart.model.InsuranceProvider;
import com.example.hospismart.repository.InsuranceProviderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/insurance")
@CrossOrigin(origins = "http://localhost:3000")
public class InsuranceAdminController extends AdminBaseController {

    @Autowired
    private InsuranceProviderRepository repo;

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");
        List<InsuranceProvider> data = repo.findAll();
        return ResponseEntity.ok(data);
    }


    @PostMapping
    public ResponseEntity<InsuranceProvider> create(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                    @RequestBody InsuranceProvider ins) {
        if (!validateAdminTokenHeader(authHeader)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(repo.save(ins));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InsuranceProvider> update(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                    @PathVariable Long id,
                                                    @RequestBody InsuranceProvider ins) {
        if (!validateAdminTokenHeader(authHeader)) {
            return ResponseEntity.status(401).build();
        }

        return repo.findById(id).map(existing -> {
            existing.setName(ins.getName());
            existing.setActive(ins.isActive());
            existing.setCoverage(ins.getCoverage());
            repo.save(existing);
            return ResponseEntity.ok(existing);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                       @PathVariable Long id) {
        if (!validateAdminTokenHeader(authHeader)) {
            return ResponseEntity.status(401).build();
        }
        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }


    @PatchMapping("/{id}/status")
    public ResponseEntity<InsuranceProvider> toggleStatus(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                          @PathVariable Long id,
                                                          @RequestBody StatusToggle st) {
        if (!validateAdminTokenHeader(authHeader)) {
            return ResponseEntity.status(401).build();
        }

        return repo.findById(id).map(existing -> {
            existing.setActive(st.isActive);
            repo.save(existing);
            return ResponseEntity.ok(existing);
        }).orElse(ResponseEntity.notFound().build());
    }

    public static class StatusToggle {
        public boolean isActive;
    }
}
