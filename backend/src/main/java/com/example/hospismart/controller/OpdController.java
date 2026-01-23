package com.example.hospismart.controller;

import com.example.hospismart.model.Department;
import com.example.hospismart.model.Doctor;
import com.example.hospismart.model.OpdTicket;
import com.example.hospismart.repository.DepartmentRepository;
import com.example.hospismart.repository.DoctorRepository;
import com.example.hospismart.repository.OpdRepository;
import com.example.hospismart.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/opd")
@CrossOrigin(origins = "http://localhost:3000")
public class OpdController {

    @Autowired
    private OpdRepository opdRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private QueueWebSocketController queueWebSocketController;

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        return value.toString().trim();
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerOpd(@RequestBody OpdTicket opdTicket) {
        opdTicket.setTicketNumber("OPD-" + (int) (Math.random() * 10000));
        opdTicket.setStatus("PENDING");

        OpdTicket savedTicket = opdRepository.save(opdTicket);

        String smsMessage = "Hello " + savedTicket.getName() + ",\n" +
                "Your OPD Ticket (" + savedTicket.getTicketNumber() + ") has been registered successfully.\n" +
                "Our staff will assign you to the appropriate department soon.\n\n" +
                "Thank you, HospiSmart.";

        String emailSubject = "OPD Ticket Confirmation - HospiSmart";
        String emailText = "Dear " + savedTicket.getName() + ",\r\n\r\n" +
                "Your OPD Ticket has been successfully registered.\r\n" +
                "Ticket No: " + savedTicket.getTicketNumber() + "\r\n" +
                "Symptoms: " + savedTicket.getSymptoms() + "\r\n\r\n" +
                "Our staff will assign your department soon.\r\n\r\n" +
                "Thank you,\r\nHospiSmart.";

        String phoneNumber = savedTicket.getPhone();
        if (!phoneNumber.startsWith("+")) {
            phoneNumber = "+977" + phoneNumber;
        }

        try {
            notificationService.sendSms(phoneNumber, smsMessage);
        } catch (Exception e) {
            System.out.println("Failed to send SMS: " + e.getMessage());
        }

        try {
            notificationService.sendEmail(savedTicket.getEmail(), emailSubject, emailText);
        } catch (Exception e) {
            System.out.println("Failed to send Email: " + e.getMessage());
        }

        return ResponseEntity.ok(savedTicket);
    }

    @PostMapping("/generate-ticket")
    public ResponseEntity<?> generateOpdTicket(@RequestBody Map<String, Object> payload) {
        try {
            OpdTicket opdTicket = new OpdTicket();

            String patientIdStr = getString(payload, "patientId");

            Long patientId = null;
            if (patientIdStr != null && !patientIdStr.isEmpty()) {
                patientId = Long.valueOf(patientIdStr);
            }

            String patientName = getString(payload, "patientName");
            if (patientName == null || patientName.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Patient name is required"));
            }

            String symptoms = getString(payload, "symptoms");
            if (symptoms == null || symptoms.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Symptoms are required"));
            }

            String departmentIdStr = getString(payload, "departmentId");

            Long departmentId = null;
            String departmentName = "General";

            if (departmentIdStr != null && !departmentIdStr.isEmpty()) {
                departmentId = Long.valueOf(departmentIdStr);

                Department dept = departmentRepository.findById(departmentId)
                        .orElseThrow(() -> new RuntimeException("Department not found"));

                departmentName = dept.getName();
            }



            boolean isFollowUp = Boolean.TRUE.equals(payload.get("isFollowUp"));

            String token = "OPD-" + LocalDateTime.now().toString().replace("-", "").substring(0, 8) +
                    "-" + String.format("%03d", (int)(Math.random() * 1000));

            opdTicket.setPatientId(patientId);
            opdTicket.setName(patientName);
            opdTicket.setSymptoms(symptoms);
            opdTicket.setTicketNumber(token);
            opdTicket.setStatus("ISSUED");
            opdTicket.setDepartmentId(departmentId);
            opdTicket.setAssignedDepartment(departmentName);
            OpdTicket saved = opdRepository.save(opdTicket);

            if (patientId != null) {
                notificationService.createInAppNotification(
                        patientId,
                        "OPD Ticket Generated",
                        "Your OPD ticket " + token + " has been created. Please wait for department assignment.",
                        "opd_ticket"
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("patientName", patientName);
            response.put("tokenNumber", token);
            response.put("consultingFee", isFollowUp ? 0 : 500);
            response.put("status", "ISSUED");
            response.put("department", departmentName);
            response.put("departmentId", departmentId);

            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<OpdTicket> getAllOpdTickets() {
        return opdRepository.findAll();
    }

    @GetMapping("/fees")
    public ResponseEntity<?> getOpdFee() {
        return ResponseEntity.ok(Map.of("fee", 500));
    }

    @GetMapping("/check-followup/{patientId}")
    public ResponseEntity<?> checkFollowUp(@PathVariable Long patientId) {
        return ResponseEntity.ok(Map.of("eligible", false));
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentTickets() {
        List<OpdTicket> recent = opdRepository.findAll().stream()
                .sorted(Comparator.comparing(OpdTicket::getId).reversed())
                .limit(10)
                .collect(Collectors.toList());

        List<Map<String, Object>> formatted = recent.stream()
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("tokenNumber", t.getTicketNumber());
                    map.put("patientName", t.getName());
                    map.put("department", t.getAssignedDepartment());
                    map.put("doctorName", t.getAssignedDoctor());
                    map.put("status", t.getStatus());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(formatted);
    }


    @PutMapping("/{ticketId}/assign")
    public ResponseEntity<?> assignDoctorAndDepartment(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Object> payload) {

        Object depObj = payload.get("departmentId");
        Object docObj = payload.get("doctorId");

        if (depObj == null || docObj == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Both departmentId and doctorId are required"));
        }

        Long departmentId;
        Long doctorId;

        try {
            if (depObj instanceof Number) departmentId = ((Number) depObj).longValue();
            else departmentId = Long.parseLong(depObj.toString());

            if (docObj instanceof Number) doctorId = ((Number) docObj).longValue();
            else doctorId = Long.parseLong(docObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid ID format"));
        }

        return opdRepository.findById(ticketId).map(ticket -> {
            departmentRepository.findById(departmentId)
                    .ifPresent(dept -> ticket.setAssignedDepartment(dept.getName()));


            doctorRepository.findById(doctorId)
                    .ifPresent(doc -> ticket.setAssignedDoctor(doc.getName()));

            ticket.setStatus("ASSIGNED");

            OpdTicket updated = opdRepository.save(ticket);

            queueWebSocketController.broadcastQueueUpdate(
                    "Queue updated! New assignment for ticket: " + ticket.getTicketNumber());

            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }


    //  Cancel OPD Ticket
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOpdTicket(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {

        return opdRepository.findById(id)
                .map(ticket -> {
                    String currentStatus = (ticket.getStatus() != null
                            ? ticket.getStatus().toUpperCase()
                            : "UNKNOWN");

                    if ("CANCELLED".equals(currentStatus) || "COMPLETED".equals(currentStatus)) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Cannot cancel - ticket is already " + currentStatus.toLowerCase()));
                    }

                    // Check if cancel is allowed (e.g., not too old)
                    if (ticket.getCreatedAt().isBefore(LocalDateTime.now().minusHours(1))) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Cannot cancel - ticket is more than 1 hour old"));
                    }

                    ticket.setStatus("CANCELLED");


                    if (payload != null && payload.containsKey("reason")) {

                    }

                    opdRepository.save(ticket);

                    queueWebSocketController.broadcastQueueUpdate("Queue updated! Ticket cancelled: " + ticket.getTicketNumber());

                    // Send notification
                    if (ticket.getPhone() != null) {
                        String sms = "Your OPD ticket (" + ticket.getTicketNumber() +
                                ") has been cancelled. Contact hospital for refund if applicable.";
                        notificationService.sendSms("+" + ticket.getPhone(), sms);
                    }

                    return ResponseEntity.ok(Map.of(
                            "message", "OPD ticket cancelled successfully",
                            "ticketId", id
                    ));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{ticketId}/complete")
    public ResponseEntity<?> completeOpdTicket(@PathVariable Long ticketId) {
        return opdRepository.findById(ticketId).map(ticket -> {
            if ("COMPLETED".equalsIgnoreCase(ticket.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Already completed"));
            }

            ticket.setStatus("COMPLETED");
            ticket.setCompletedAt(LocalDateTime.now());

            opdRepository.save(ticket);

            queueWebSocketController.broadcastQueueUpdate("Queue updated! Token " + ticket.getTicketNumber() + " completed");


            if (ticket.getPhone() != null) {
                String sms = "Your OPD consultation (Token: " + ticket.getTicketNumber() + ") is now complete. Thank you!";
                notificationService.sendSms("+" + ticket.getPhone(), sms);
            }

            return ResponseEntity.ok(Map.of("message", "OPD consultation completed"));
        }).orElse(ResponseEntity.notFound().build());
    }
}