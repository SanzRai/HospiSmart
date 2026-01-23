package com.example.hospismart.repository;

import com.example.hospismart.model.PatientInsurance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientInsuranceRepository extends JpaRepository<PatientInsurance, Long> {
    @Query("SELECT pi FROM PatientInsurance pi WHERE pi.patient.id = :patientId AND pi.isActive = true")
    List<PatientInsurance> findActiveByPatientId(@Param("patientId") Long patientId);

    Optional<PatientInsurance> findByPolicyNumber(String policyNumber);
}