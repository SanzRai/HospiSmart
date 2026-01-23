package com.example.hospismart.repository;

import com.example.hospismart.model.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    List<FamilyMember> findByPrimaryPatient_Id(Long patientId);
}
