package com.example.hospismart.controller;

import com.example.hospismart.model.Appointment;
import com.example.hospismart.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping("/online-recent")
    public ResponseEntity<?> getOnlineRecentBookings() {
        LocalDate today = LocalDate.now();


        List<Appointment> onlineOpdToday = appointmentRepository.findAll().stream()
                .filter(apt -> {
                    if (apt.getAppointmentDate() == null) return false;
                    boolean isToday = apt.getAppointmentDate().equals(today);
                    boolean isOpd = apt.getAppointmentTime() == null || "Queue".equalsIgnoreCase(apt.getAppointmentTime().toString());
                    boolean isPaid = "PAID".equalsIgnoreCase(apt.getPaymentStatus());
                    return isToday && isOpd && isPaid;
                })
                .sorted((a, b) -> Long.compare(b.getId(), a.getId())) // newest first
                .collect(Collectors.toList());

        List<Appointment> upcomingAppointments = appointmentRepository.findAll().stream()
                .filter(apt -> {
                    if (apt.getAppointmentDate() == null) return false;
                    boolean hasTime = apt.getAppointmentTime() != null && !"Queue".equalsIgnoreCase(apt.getAppointmentTime().toString());
                    return hasTime && !apt.getAppointmentDate().isBefore(today);
                })
                .sorted((a, b) -> {
                    int dateCompare = a.getAppointmentDate().compareTo(b.getAppointmentDate());
                    if (dateCompare != 0) return dateCompare;
                    LocalTime timeA = a.getAppointmentTime() != null ? a.getAppointmentTime() : LocalTime.MIN;
                    LocalTime timeB = b.getAppointmentTime() != null ? b.getAppointmentTime() : LocalTime.MIN;
                    return timeA.compareTo(timeB);
                })
                .collect(Collectors.toList());


        List<Map<String, Object>> formattedOpd = onlineOpdToday.stream().map(apt -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", apt.getId());
            map.put("patientId", apt.getPatientId());
            map.put("patientName", apt.getPatientName());
            map.put("phone", apt.getPatientPhone());
            map.put("symptoms", apt.getSymptoms());
            map.put("department", apt.getDepartment() != null ? apt.getDepartment() : "General OPD");
            map.put("paymentStatus", apt.getPaymentStatus());
            map.put("status", apt.getStatus() != null ? apt.getStatus().toLowerCase() : "pending"); // ADDED
            map.put("bookedAt", apt.getAppointmentDate().toString());
            map.put("tokenNumber", apt.getTokenNumber());
            return map;
        }).collect(Collectors.toList());

        List<Map<String, Object>> formattedAppointments = upcomingAppointments.stream().map(apt -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", apt.getId());
            map.put("patientName", apt.getPatientName());
            map.put("phone", apt.getPatientPhone());
            map.put("doctorName", apt.getDoctorName());
            map.put("doctorId", apt.getDoctorId());
            map.put("department", apt.getDepartment());
            map.put("appointmentDate", apt.getAppointmentDate().toString());
            map.put("appointmentTime", apt.getAppointmentTime() != null ? apt.getAppointmentTime().toString() : "Queue");
            map.put("consultingFee", apt.getPayableAmount());
            map.put("paymentStatus", apt.getPaymentStatus() != null ? apt.getPaymentStatus() : "PENDING");
            map.put("status", apt.getStatus() != null ? apt.getStatus().toLowerCase() : "pending"); // ADDED
            map.put("tokenNumber", apt.getTokenNumber());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("opd", formattedOpd);
        response.put("appointments", formattedAppointments);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/online/{id}/pay-counter")
    public ResponseEntity<?> markAsPaidAtCounter(@PathVariable Long id) {
        return appointmentRepository.findById(id)
                .map(apt -> {
                    if ("PENDING".equalsIgnoreCase(apt.getPaymentStatus())) {
                        apt.setPaymentStatus("PAID");
                        apt.setPaidAmount(apt.getPayableAmount());
                        apt.setPaymentMethod("counter");
                        appointmentRepository.save(apt);
                        return ResponseEntity.ok(Map.of("message", "Payment marked as paid"));
                    }
                    return ResponseEntity.badRequest().body(Map.of("error", "Already paid"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}