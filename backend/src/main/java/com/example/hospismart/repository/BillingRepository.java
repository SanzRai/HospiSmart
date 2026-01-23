package com.example.hospismart.repository;

import com.example.hospismart.model.Billing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillingRepository extends JpaRepository<Billing, Long> {
    List<Billing> findByPaymentStatus(String paymentStatus);
    List<Billing> findByPatientId(Long patientId);
    List<Billing> findByPatientIdAndPaymentStatus(Long patientId, String paymentStatus);

}
