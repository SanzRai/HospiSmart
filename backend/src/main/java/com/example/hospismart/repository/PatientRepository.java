package com.example.hospismart.repository;

import com.example.hospismart.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long>{
    Optional<Patient> findByPhoneNumber(String phoneNumber);
    Optional<Patient> findByEmail (String email);

    Optional<Patient> findFirstByPhoneNumberContainingIgnoreCase(String phone);

    Optional<Patient> findByUhid(String uhid);
    List<Patient> findByInsuranceVerifiedTrue();

    List<Patient> findByIsBlacklisted(boolean blacklisted);
    List<Patient> findBySsfNumberIsNotNull();
    List<Patient> findByInsuranceProviderIdIsNotNull();



}
