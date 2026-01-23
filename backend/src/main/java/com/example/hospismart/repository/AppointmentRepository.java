package com.example.hospismart.repository;

import com.example.hospismart.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>{
        List<Appointment> findByAppointmentDate(LocalDate date);

        Optional<Appointment> findByTokenNumber(String tokenNumber);
        List<Appointment> findByPatientIdAndStatus(Long patientId, String status);
        List<Appointment> findByPatientIdAndPaymentStatus(Long patientId, String paymentStatus);
        List<Appointment> findByPaymentStatus(String paymentStatus);




}
