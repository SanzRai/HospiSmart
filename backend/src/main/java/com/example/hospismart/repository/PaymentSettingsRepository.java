package com.example.hospismart.repository;

import com.example.hospismart.model.PaymentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentSettingsRepository extends JpaRepository<PaymentSettings, Long> {

}
