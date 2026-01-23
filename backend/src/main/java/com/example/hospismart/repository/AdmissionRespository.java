package com.example.hospismart.repository;

import com.example.hospismart.dto.AdmissionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdmissionRespository extends JpaRepository<AdmissionRequest, Long> {
    List<AdmissionRequest> findByStatus(String status);

}
