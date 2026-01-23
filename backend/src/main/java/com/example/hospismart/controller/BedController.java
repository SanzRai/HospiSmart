package com.example.hospismart.controller;

import com.example.hospismart.model.Bed;
import com.example.hospismart.repository.BedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
@CrossOrigin(origins = "http://localhost:3000")
public class BedController {

    @Autowired
    private BedRepository bedRepository;

    @GetMapping
    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    @PostMapping("/init")
    public ResponseEntity<?> initBeds() {
        if(bedRepository.count() == 0) {
            for(int i=1; i<=10; i++) bedRepository.save(createBed("General Ward", "GW-0"+i));
            for(int i=1; i<=5; i++) bedRepository.save(createBed("ICU", "ICU-0"+i));
            for(int i=1; i<=5; i++) bedRepository.save(createBed("Cabin", "CB-0"+i));
            return ResponseEntity.ok("Beds initialized");
        }
        return ResponseEntity.badRequest().body("Beds already exist");
    }

    @PostMapping("/add")
    public ResponseEntity<?> addBed(@RequestBody Bed bed) {
        bed.setStatus("AVAILABLE"); 
        Bed saved = bedRepository.save(bed);
        return ResponseEntity.ok(saved);
    }


    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateBedStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return bedRepository.findById(id).map(bed -> {
            bed.setStatus(payload.get("status"));
            bedRepository.save(bed);
            return ResponseEntity.ok(bed);
        }).orElse(ResponseEntity.notFound().build());
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBed(@PathVariable Long id) {
        if(bedRepository.existsById(id)) {
            bedRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Bed deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    private Bed createBed(String ward, String num) {
        Bed b = new Bed();
        b.setWard(ward);
        b.setBedNumber(num);
        b.setStatus("AVAILABLE");
        return b;
    }
}