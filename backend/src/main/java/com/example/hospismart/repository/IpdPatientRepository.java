package com.example.hospismart.repository;

import com.example.hospismart.model.IpdPatient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IpdPatientRepository extends JpaRepository<IpdPatient, Long> {
    List<IpdPatient> findByDepositBalanceLessThan(double amount);
    Optional<IpdPatient> findByPatientId(Long patientId);
}