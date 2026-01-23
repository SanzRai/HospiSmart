package com.example.hospismart.repository;

import com.example.hospismart.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByEmployeeId(String employeeId);
    Optional<Staff> findByEmail(String email);
    Optional<Staff> findByEmployeeIdAndIsActiveTrue(String employeeId);

}
