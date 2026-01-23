package com.example.hospismart.controller;

import com.example.hospismart.model.Appointment;
import com.example.hospismart.model.OpdTicket;
import com.example.hospismart.repository.AppointmentRepository;
import com.example.hospismart.repository.OpdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/opd")
@CrossOrigin(origins = "http://localhost:3000")
public class OpdQueueController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private QueueWebSocketController queueWebSocketController;

    @Autowired
    private OpdRepository opdRepository;

    @GetMapping("/queue/all")
    public ResponseEntity<?> getAllUpcomingQueue() {
        LocalDate today = LocalDate.now();

        List<Appointment> sortedSpecialistQueue = appointmentRepository.findAll().stream()
                .filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(today))
                .filter(a -> "PAID".equalsIgnoreCase(a.getPaymentStatus()) ||
                        "CONFIRMED".equalsIgnoreCase(a.getStatus()))
                .sorted(Comparator.comparing(Appointment::getAppointmentDate)
                        .thenComparing(
                                a -> a.getAppointmentTime() != null ? a.getAppointmentTime() : LocalTime.MAX,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        ))
                .collect(Collectors.toList());

        List<OpdTicket> opdQueue = opdRepository.findAll().stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().equals(today))
                .filter(t -> "ISSUED".equalsIgnoreCase(t.getStatus()) ||
                        "PENDING".equalsIgnoreCase(t.getStatus()))
                .sorted(Comparator.comparing(OpdTicket::getCreatedAt))
                .collect(Collectors.toList());

        List<Map<String, Object>> unifiedQueue = new ArrayList<>();

        for (Appointment apt : sortedSpecialistQueue) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "APPOINTMENT");
            item.put("id", apt.getId());
            item.put("tokenNumber", apt.getTokenNumber());
            item.put("patientPhone", apt.getPatientPhone());
            item.put("patientName", apt.getPatientName());
            item.put("department", apt.getDepartment() != null ? apt.getDepartment() : "General");
            item.put("departmentId", apt.getDepartmentId());
            item.put("status", apt.getStatus());
            item.put("paymentStatus", apt.getPaymentStatus());
            item.put("appointmentDate", apt.getAppointmentDate());
            item.put("appointmentTime", apt.getAppointmentTime() != null ? apt.getAppointmentTime().toString() : "Queue");
            item.put("symptoms", apt.getSymptoms() != null ? apt.getSymptoms() : "Not provided");
            unifiedQueue.add(item);
        }

        for (OpdTicket ticket : opdQueue) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "OPD");
            item.put("id", ticket.getId());
            item.put("tokenNumber", ticket.getTicketNumber());
            item.put("patientPhone", ticket.getPhone());
            item.put("patientName", ticket.getName());
            item.put("department", ticket.getAssignedDepartment() != null ? ticket.getAssignedDepartment() : "General");
            item.put("departmentId", ticket.getDepartmentId());
            item.put("doctorId", ticket.getAssignedDoctorId());
            item.put("status", ticket.getStatus());
            item.put("paymentStatus", "PENDING");
            item.put("appointmentDate", ticket.getCreatedAt() != null ? ticket.getCreatedAt().toLocalDate() : null);
            item.put("appointmentTime", "Queue");
            item.put("symptoms", ticket.getSymptoms() != null ? ticket.getSymptoms() : "Not provided");
            unifiedQueue.add(item);
        }

        unifiedQueue.sort(Comparator.comparing(
                (Map<String, Object> m) -> (LocalDate) m.get("appointmentDate"),
                Comparator.nullsLast(Comparator.naturalOrder())
        ).thenComparing(
                (Map<String, Object> m) -> {
                    String timeStr = (String) m.get("appointmentTime");
                    return timeStr != null && !"Queue".equals(timeStr)
                            ? LocalTime.parse(timeStr)
                            : LocalTime.MAX;
                },
                Comparator.nullsLast(Comparator.naturalOrder())
        ));

        return ResponseEntity.ok(unifiedQueue);
    }

    @PostMapping("/{id}/vitals")
    public ResponseEntity<?> recordVitals(@PathVariable Long id, @RequestBody Map<String, String> vitals) {
        return appointmentRepository.findById(id).map(apt -> {
            apt.setBloodPressure(vitals.get("bloodPressure"));
            apt.setPulse(vitals.get("pulse"));
            apt.setTemperature(vitals.get("temperature"));
            apt.setWeight(vitals.get("weight"));
            apt.setSpo2(vitals.get("spo2"));
            apt.setRespiratoryRate(vitals.get("respiratoryRate"));
            apt.setRecordedBy(vitals.get("recordedBy"));
            apt.setVitalsRecorded(true);
            apt.setStatus("VITALS_DONE");
            appointmentRepository.save(apt);
            return ResponseEntity.ok(Map.of("success", true, "message", "Vitals Recorded"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/call")
    public ResponseEntity<?> callPatient(@PathVariable Long id) {
        return appointmentRepository.findById(id).map(apt -> {
            queueWebSocketController.broadcastQueueUpdate(
                    "Patient called! Current token: " + apt.getTokenNumber()
            );
            return ResponseEntity.ok(Map.of("message", "Patient Called"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/absent")
    public ResponseEntity<?> markAbsent(@PathVariable Long id) {
        return appointmentRepository.findById(id).map(apt -> {
            apt.setStatus("ABSENT");
            appointmentRepository.save(apt);
            queueWebSocketController.broadcastQueueUpdate(
                    "Queue updated! Token " + apt.getTokenNumber() + " marked absent"
            );
            return ResponseEntity.ok(Map.of("message", "Marked Absent"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/assign-doctor")
    public ResponseEntity<?> assignDoctor(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return opdRepository.findById(id).map(ticket -> {
            Long doctorId = Long.valueOf(payload.get("doctorId").toString());
            Long deptId = Long.valueOf(payload.get("departmentId").toString());
            ticket.setAssignedDoctorId(doctorId);
            ticket.setAssignedDepartment(deptId.toString());
            ticket.setStatus("ASSIGNED");
            opdRepository.save(ticket);
            return ResponseEntity.ok(Map.of("success", true, "message", "Doctor assigned"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
