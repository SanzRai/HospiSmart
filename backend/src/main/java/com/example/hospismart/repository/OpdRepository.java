package com.example.hospismart.repository;

import com.example.hospismart.model.OpdTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpdRepository extends JpaRepository<OpdTicket, Long> {
    List<OpdTicket> findByPatientIdAndStatus(Long patientId, String status);
}