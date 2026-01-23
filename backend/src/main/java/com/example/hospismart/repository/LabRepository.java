package com.example.hospismart.repository;

import com.example.hospismart.dto.LabTestRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LabRepository extends JpaRepository<LabTestRequest, Long> {
    List<LabTestRequest> findByStatus(String status);

    List<LabTestRequest> findByPatient_Id(Long patientId);

    List<LabTestRequest> findByPatient_IdAndStatus(Long patientId, String status);


}

