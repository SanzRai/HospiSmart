package com.example.hospismart.repository;

import com.example.hospismart.model.SsfRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SsfRateRepository extends JpaRepository<SsfRate, Long>{
    SsfRate findByServiceCode(String servicecode);
}
