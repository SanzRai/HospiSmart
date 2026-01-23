package com.example.hospismart.controller;

import com.example.hospismart.model.Appointment;
import com.example.hospismart.model.OpdTicket;
import com.example.hospismart.model.Prescription;
import com.example.hospismart.repository.AppointmentRepository;
import com.example.hospismart.repository.OpdRepository;
import com.example.hospismart.repository.PrescriptionRepository;
import com.example.hospismart.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:3000")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private OpdRepository opdRepository;

    private static final Set<String> CANCEL_ALLOWED_STATUSES =
            Set.of("PENDING", "CONFIRMED", "PAID");

    private static final Set<String> RESCHEDULE_ALLOWED_STATUSES =
            Set.of("PENDING", "CONFIRMED", "PAID", "RESCHEDULED");

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody Appointment appointment) {
        System.out.println("Received appointment: " + appointment);
        System.out.println("DoctorId received: " + appointment.getDoctorId());
        System.out.println("DoctorName received: " + appointment.getDoctorName());

        appointment.setTokenNumber("A-" + (int)(Math.random() * 1000));
        appointment.setStatus("PENDING");

        Appointment savedAppointment = appointmentRepository.save(appointment);

        notificationService.createInAppNotification(
                savedAppointment.getPatientId(),
                "Appointment Confirmed",
                String.format("Booking with Dr. %s on %s at %s (Token: %s)",
                        savedAppointment.getDoctorName(),
                        savedAppointment.getAppointmentDate(),
                        savedAppointment.getAppointmentTime(),
                        savedAppointment.getTokenNumber()),
                "appointment"
        );

        String smsMessage = "Hello " + savedAppointment.getPatientName() + ",\n" +
                "Your appointment with " + savedAppointment.getDoctorName() + " on " +
                savedAppointment.getAppointmentDate() + " at " + savedAppointment.getAppointmentTime() +
                " is confirmed. Token Number: " + savedAppointment.getTokenNumber() + ".\n" +
                " Please arrive 15 minutes early. Thank you, HospiSmart.";

        String emailSubject = "Appointment Confirmation - HospiSmart";
        String emailText = "Dear " + savedAppointment.getPatientName() + ",\r\n\r\n" +
                "Your appointment has been booked successfully.\r\n" +
                "Doctor: " + savedAppointment.getDoctorName() + "\r\n" +
                "Department: " + savedAppointment.getDepartment() + "\r\n" +
                "Date: " + savedAppointment.getAppointmentDate() + "\r\n" +
                "Time: " + savedAppointment.getAppointmentTime() + "\r\n" +
                "Token Number: " + savedAppointment.getTokenNumber() + "\r\n\r\n" +
                "Please arrive 15 minutes early.\r\n\r\n" +
                "Thank you,\r\n HospiSmart.";

        String phoneNumber = savedAppointment.getPatientPhone();
        if (!phoneNumber.startsWith("+")) {
            phoneNumber = "+977" + phoneNumber;
        }

        notificationService.sendSms(phoneNumber, smsMessage);
        notificationService.sendEmail(savedAppointment.getPatientEmail(), emailSubject, emailText);

        return ResponseEntity.ok(savedAppointment);
    }

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {

        return appointmentRepository.findById(id)
                .map(appointment -> {
                    String currentStatus = (appointment.getStatus() != null
                            ? appointment.getStatus().toUpperCase()
                            : "UNKNOWN");

                    if ("CANCELLED".equals(currentStatus) || "COMPLETED".equals(currentStatus)) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Cannot cancel - appointment is already " + currentStatus.toLowerCase()));
                    }

                    if (!CANCEL_ALLOWED_STATUSES.contains(currentStatus)) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error",
                                        "Cannot cancel appointment with status: " + currentStatus));
                    }

                    appointment.setStatus("CANCELLED");
                    appointment.setPaymentStatus("CANCELLED");

                    if (payload != null && payload.containsKey("reason")) {
                        appointment.setCancellationReason(payload.get("reason"));
                    }

                    appointmentRepository.save(appointment);

                    if (appointment.getPatientPhone() != null) {
                        String sms = "Your appointment (Token: " + appointment.getTokenNumber() +
                                ") has been cancelled. Reason: " +
                                (appointment.getCancellationReason() != null
                                        ? appointment.getCancellationReason()
                                        : "Not specified") +
                                ". Contact hospital for refund if paid.";
                        notificationService.sendSms("+" + appointment.getPatientPhone(), sms);
                    }

                    return ResponseEntity.ok(Map.of(
                            "message", "Appointment cancelled successfully",
                            "appointmentId", id,
                            "reason", appointment.getCancellationReason()
                    ));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> rescheduleAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        return appointmentRepository.findById(id)
                .map(appointment -> {
                    String currentStatus = (appointment.getStatus() != null
                            ? appointment.getStatus().toUpperCase()
                            : "UNKNOWN");

                    if (!RESCHEDULE_ALLOWED_STATUSES.contains(currentStatus)) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error",
                                        "Cannot reschedule appointment with status: " + currentStatus));
                    }

                    String newDateStr = (String) payload.get("appointmentDate");
                    String newTimeStr = (String) payload.get("appointmentTime");

                    if (newDateStr == null || newTimeStr == null) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "New date and time are required"));
                    }

                    try {
                        LocalDate newDate = LocalDate.parse(newDateStr);
                        LocalTime newTime = LocalTime.parse(newTimeStr);

                        if (newDate.isBefore(LocalDate.now())) {
                            return ResponseEntity.badRequest()
                                    .body(Map.of("error", "Cannot reschedule to a past date"));
                        }

                        appointment.setAppointmentDate(newDate);
                        appointment.setAppointmentTime(newTime);
                        appointment.setStatus("RESCHEDULED");

                        appointmentRepository.save(appointment);

                        if (appointment.getPatientPhone() != null) {
                            String sms = "Your appointment has been rescheduled to " +
                                    newDate + " at " + newTime +
                                    ". Token: " + appointment.getTokenNumber();
                            notificationService.sendSms("+" + appointment.getPatientPhone(), sms);
                        }

                        return ResponseEntity.ok(Map.of(
                                "message", "Appointment rescheduled successfully",
                                "newDate", newDate.toString(),
                                "newTime", newTime.toString(),
                                "appointmentId", id,
                                "newStatus", "RESCHEDULED"
                        ));

                    } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Invalid date or time format"));
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    //History
    @GetMapping("/patient/{patientId}/completed")
    public ResponseEntity<?> getCompletedPatientVisits(@PathVariable Long patientId) {
        List<Map<String, Object>> history = new ArrayList<>();

        // 1. Completed specialist appointments
        List<Appointment> completedAppointments = appointmentRepository
                .findByPatientIdAndStatus(patientId, "COMPLETED");

        List<Prescription> prescriptions = prescriptionRepository
                .findByPatientId(patientId);

        Map<Long, Prescription> prescriptionMap = prescriptions.stream()
                .filter(p -> p.getAppointmentId() != null)
                .collect(Collectors.toMap(
                        Prescription::getAppointmentId,
                        p -> p,
                        (p1, p2) -> p1
                ));

        for (Appointment apt : completedAppointments) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "APPOINTMENT");
            item.put("id", apt.getId());
            item.put("date", apt.getAppointmentDate());
            item.put("time", apt.getAppointmentTime() != null ? apt.getAppointmentTime().toString() : "Queue");
            item.put("doctorName", apt.getDoctorName() != null ? apt.getDoctorName() : "N/A");
            item.put("department", apt.getDepartment() != null ? apt.getDepartment() : "General");
            item.put("tokenNumber", apt.getTokenNumber());

            Prescription rx = prescriptionMap.get(apt.getId());
            if (rx != null) {
                item.put("diagnosis", rx.getDiagnosis() != null ? rx.getDiagnosis() : "Not recorded");
                item.put("notes", rx.getAdvice() != null ? rx.getAdvice() :
                        (rx.getChiefComplaint() != null ? "Chief complaint: " + rx.getChiefComplaint() : "No notes available"));
                item.put("outcome", rx.getOutcome());
                item.put("followUpDays", rx.getFollowUpDays());
            } else {
                item.put("diagnosis", "Not recorded");
                item.put("notes", "Consultation completed - no prescription details available");
                item.put("outcome", null);
                item.put("followUpDays", null);
            }
            history.add(item);
        }

        // 2. Completed OPD tickets
        List<OpdTicket> completedOpd = opdRepository
                .findByPatientIdAndStatus(patientId, "COMPLETED");

        for (OpdTicket ticket : completedOpd) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "OPD");
            item.put("id", ticket.getId());
            item.put("date", ticket.getCreatedAt() != null ? ticket.getCreatedAt().toLocalDate() : null);
            item.put("time", "Queue");
            item.put("doctorName", ticket.getAssignedDoctor() != null ? ticket.getAssignedDoctor() : "General OPD");
            item.put("department", ticket.getAssignedDepartment() != null ? ticket.getAssignedDepartment() : "General");
            item.put("diagnosis", "General OPD Visit");
            item.put("notes", "OPD ticket completed" +
                    (ticket.getCancellationReason() != null ? " (Cancelled earlier: " + ticket.getCancellationReason() + ")" : ""));
            item.put("tokenNumber", ticket.getTicketNumber());
            history.add(item);
        }

        history.sort(Comparator.comparing(
                m -> (LocalDate) m.get("date"),
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return ResponseEntity.ok(history);
    }
}