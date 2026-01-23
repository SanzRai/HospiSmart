package com.example.hospismart.repository;

import com.example.hospismart.model.Bed;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByStatus(String status);
    List<Bed> findByWard(String ward);
}
