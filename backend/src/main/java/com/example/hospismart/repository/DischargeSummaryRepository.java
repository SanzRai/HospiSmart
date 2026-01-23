package com.example.hospismart.repository;
import com.example.hospismart.model.DischargeSummary;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DischargeSummaryRepository extends JpaRepository<DischargeSummary, Long> {
}