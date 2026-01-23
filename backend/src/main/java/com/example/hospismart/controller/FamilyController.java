package com.example.hospismart.controller;

import com.example.hospismart.dto.FamilyMemberRequest;
import com.example.hospismart.model.FamilyMember;
import com.example.hospismart.model.Patient;
import com.example.hospismart.repository.FamilyMemberRepository;
import com.example.hospismart.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
@CrossOrigin(origins = "http://localhost:3000",
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.PUT})
public class FamilyController {

    @Autowired
    private FamilyMemberRepository familyRepo;

    @Autowired
    private PatientRepository patientRepo;

    @GetMapping("/{patientId}")
    public List<FamilyMember> getFamilyMembers(@PathVariable Long patientId) {
        return familyRepo.findByPrimaryPatient_Id(patientId);
    }

    @PostMapping("/add")
    public FamilyMember addFamilyMember(@RequestBody FamilyMemberRequest request) {
        Patient primary = patientRepo.findById(request.getPrimaryPatientId())
                .orElseThrow(() -> new RuntimeException("Primary patient not found"));

        FamilyMember member = new FamilyMember();
        member.setName(request.getName());
        member.setRelation(request.getRelation());
        member.setPhone(request.getPhone());
        member.setPrimaryPatient(primary);

        return familyRepo.save(member);
    }

    @DeleteMapping("/{familyMemberId}")
    public ResponseEntity<String> deleteFamilyMember(@PathVariable Long familyMemberId) {
        FamilyMember member = familyRepo.findById(familyMemberId)
                .orElseThrow(() -> new RuntimeException("Family member not found with ID: " + familyMemberId));

        familyRepo.delete(member);

        return ResponseEntity.ok("Family member deleted successfully");
    }
}