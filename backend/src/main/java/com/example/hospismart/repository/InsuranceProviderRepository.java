package com.example.hospismart.repository;

import com.example.hospismart.model.InsuranceProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InsuranceProviderRepository extends JpaRepository <InsuranceProvider, Long> {


}
