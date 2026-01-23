package com.example.hospismart.controller;

import com.example.hospismart.dto.BillingRequest;
import com.example.hospismart.model.Billing;
import com.example.hospismart.model.IpdPatient;
import com.example.hospismart.model.Patient;
import com.example.hospismart.repository.AppointmentRepository;
import com.example.hospismart.model.Appointment;
import com.example.hospismart.repository.BillingRepository;
import com.example.hospismart.repository.IpdPatientRepository;
import com.example.hospismart.repository.PatientRepository;
import com.example.hospismart.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/billing")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class BillingController {

    @Autowired
    private IpdPatientRepository ipdPatientRepository;

    @Autowired
    private PatientRepository patientRepository;

    private final BillingService billingService;
    @Autowired
    private  AppointmentRepository appointmentRepository;
    private final BillingRepository billingRepository;

    @GetMapping("/ipd")
    public ResponseEntity<List<Map<String, Object>>> getIpdBills() {
        List<IpdPatient> patients = ipdPatientRepository.findAll();

        List<Map<String, Object>> response = patients.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("patientName", p.getPatientName());
            map.put("uhid", p.getUhid());
            map.put("ward", p.getWard());
            map.put("bedNumber", p.getBedNumber());
            map.put("runningBill", p.getRunningBill());
            map.put("depositBalance", p.getDepositBalance());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> addDeposit(@RequestBody Map<String, Object> payload) {
        try {
            Long patientId = Long.valueOf(payload.get("patientId").toString());
            double amount = Double.parseDouble(payload.get("amount").toString());

            IpdPatient patient = ipdPatientRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("IPD Patient not found"));

            patient.setDepositBalance(patient.getDepositBalance() + amount);
            ipdPatientRepository.save(patient);

            return ResponseEntity.ok(Map.of("message", "Deposit added successfully", "newBalance", patient.getDepositBalance()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody BillingRequest request) {
        Billing billing = billingService.createBilling(request);
        return ResponseEntity.ok(Map.of(
                "receiptId", billing.getReceiptId(),
                "finalAmount", billing.getFinalAmount(),
                "status", "SUCCESS"
        ));
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingBills(
            @RequestParam(value = "patientId", required = false) Long patientId) {

        if (patientId == null || patientId <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid or missing patientId"));
        }
        List<Map<String, Object>> pending = new ArrayList<>();


        List<Appointment> unpaidAppointments = appointmentRepository
                .findByPatientIdAndPaymentStatus(patientId, "PENDING");

        for (Appointment apt : unpaidAppointments) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", apt.getId());
            m.put("tokenNumber", apt.getTokenNumber());
            m.put("serviceType", apt.getTokenNumber() != null && apt.getTokenNumber().startsWith("OPD")
                    ? "OPD Consultation" : "Appointment");
            m.put("bookingType", apt.getTokenNumber() != null && apt.getTokenNumber().startsWith("OPD")
                    ? "OPD" : "APPOINTMENT");
            m.put("amount", apt.getConsultingFee());
            m.put("department", apt.getDepartment() != null ? apt.getDepartment() : "General");
            m.put("doctorName", apt.getDoctorName() != null ? apt.getDoctorName() : "N/A");
            m.put("date", apt.getAppointmentDate() != null ? apt.getAppointmentDate().toString() : null);
            m.put("patientName", apt.getPatientName());
            pending.add(m);
        }

        ipdPatientRepository.findByPatientId(patientId).ifPresent(ipd -> {
            double due = ipd.getRunningBill() - ipd.getDepositBalance();
            if (due > 0) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", "IPD-" + ipd.getId());
                m.put("serviceType", "IPD Admission");
                m.put("bookingType", "IPD");
                m.put("amount", due);
                m.put("department", ipd.getWard());
                m.put("date", ipd.getAdmissionDate() != null ? ipd.getAdmissionDate().toString() : null);
                m.put("patientName", ipd.getPatientName());
                pending.add(m);
            }
        });

        return ResponseEntity.ok(pending);
    }

    @GetMapping("/paid")
    public ResponseEntity<List<Map<String, Object>>> getPaidBills(@RequestParam Long patientId) {
        List<Billing> paid = billingRepository.findByPatientIdAndPaymentStatus(patientId, "PAID");

        List<Map<String, Object>> result = paid.stream().map(b -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", b.getId());
            m.put("receiptId", b.getReceiptId());
            m.put("serviceName", b.getServiceName());
            m.put("amount", b.getFinalAmount());
            m.put("paymentDate", b.getPaymentDate());
            m.put("paymentMethod", b.getPaymentMethod());
            m.put("department", b.getDepartment());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/pending-all")
    public ResponseEntity<List<Map<String, Object>>> getAllPendingBills() {
        List<Map<String, Object>> pending = new ArrayList<>();

        List<Appointment> unpaidAppointments = appointmentRepository.findByPaymentStatus("PENDING");
        for (Appointment apt : unpaidAppointments) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", apt.getId());
            m.put("tokenNumber", apt.getTokenNumber());
            m.put("serviceType", apt.getTokenNumber() != null && apt.getTokenNumber().startsWith("OPD")
                    ? "OPD Consultation" : "Appointment");
            m.put("bookingType", apt.getTokenNumber() != null && apt.getTokenNumber().startsWith("OPD")
                    ? "OPD" : "APPOINTMENT");
            m.put("amount", apt.getConsultingFee());
            m.put("patientName", apt.getPatientName());
            pending.add(m);
        }


        return ResponseEntity.ok(pending);
    }

    @GetMapping("/patients/insured")
    public ResponseEntity<List<Patient>> getInsuredPatients() {
        List<Patient> insured = patientRepository.findByInsuranceProviderIdIsNotNull();
        return ResponseEntity.ok(insured);
    }
}
