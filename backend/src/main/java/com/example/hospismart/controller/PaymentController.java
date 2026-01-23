package com.example.hospismart.controller;

import com.example.hospismart.dto.LabTestRequest;
import com.example.hospismart.dto.PatientBillPaymentRequest;
import com.example.hospismart.dto.PaymentRequest;
import com.example.hospismart.dto.SsfCheckResponse;
import com.example.hospismart.model.*;
import com.example.hospismart.repository.*;
import com.example.hospismart.service.InsuranceService;
import com.example.hospismart.service.NotificationService;
import com.example.hospismart.service.SsfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private IpdPatientRepository ipdPatientRepository;
    @Autowired private BillingRepository billingRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private LabRepository labRepository;

    @Autowired private NotificationService notificationService;
    @Autowired private SsfService ssfService;
    @Autowired private InsuranceService insuranceService;

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest request) {
        try {
            double originalAmount = request.getConsultingFee();
            double covered = 0;
            double payable = originalAmount;

            String paymentType = request.getPaymentType();
            String bookingType = request.getBookingType();

            boolean discountsAllowed = bookingType != null &&
                    !bookingType.equalsIgnoreCase("OPD") &&
                    !bookingType.equalsIgnoreCase("APPOINTMENT");

            if (discountsAllowed) {
                if ("SSF".equalsIgnoreCase(paymentType) && request.getSsfNumber() != null) {
                    try {
                        SsfCheckResponse ssfCheck = ssfService.checkSsfEligibility(
                                request.getSsfNumber(),
                                bookingType,
                                originalAmount
                        );
                        if (ssfCheck.eligible()) {
                            covered = ssfCheck.ssfCovers();
                            payable = ssfCheck.finalPatientAmount();
                        }
                    } catch (Exception ignored) {}
                } else if ("INSURANCE".equalsIgnoreCase(paymentType)) {
                    Optional<Patient> patientOpt = patientRepository.findByPhoneNumber(request.getPhoneNumber());
                    if (patientOpt.isPresent()) {
                        PatientInsurance insurance = insuranceService.getEligibleInsurance(
                                patientOpt.get().getId(),
                                bookingType
                        );
                        if (insurance != null) {
                            payable = insuranceService.applyDiscount(originalAmount, insurance, bookingType);
                            covered = originalAmount - payable;
                        }
                    }
                } else if ("STAFF".equalsIgnoreCase(paymentType) && request.getStaffDiscountPercent() != null) {
                    double staffDiscount = request.getStaffDiscountPercent() / 100.0;
                    covered = originalAmount * staffDiscount;
                    payable = originalAmount - covered;
                }
            } else {
                covered = 0;
                payable = originalAmount;
                paymentType = "SELF";
            }

            Appointment apt = new Appointment();

            apt.setPatientId(request.getPatientId() != null ? request.getPatientId() : null);
            apt.setPatientName(request.getPatientName());
            apt.setPatientEmail(request.getPatientEmail());
            apt.setPatientPhone(request.getPhoneNumber());
            apt.setSymptoms(request.getSymptoms() != null ? request.getSymptoms() : "Walk-in patient");

            apt.setDoctorName(request.getDoctorName());
            apt.setDoctorId(request.getDoctorId());
            apt.setDepartment(request.getDepartment());

            apt.setAppointmentDate(
                    request.getAppointmentDate() != null ?
                            LocalDate.parse(request.getAppointmentDate()) :
                            LocalDate.now()
            );

            apt.setAppointmentTime(
                    request.getAppointmentTime() != null && !request.getAppointmentTime().equals("null") ?
                            LocalTime.parse(request.getAppointmentTime()) :
                            null
            );

            apt.setTokenNumber(request.getBookingToken());
            apt.setConsultingFee(originalAmount);
            apt.setCoveredAmount(covered);
            apt.setPayableAmount(payable);

            boolean isPayAtCounter = "counter".equalsIgnoreCase(request.getPaymentMethod());

            if (isPayAtCounter) {
                apt.setPaymentStatus("PENDING");
                apt.setPaidAmount(0.0);
            } else {
                apt.setPaymentStatus("PAID");
                apt.setPaidAmount(payable);
            }

            apt.setPaymentMethod(request.getPaymentMethod());
            apt.setPaymentType(paymentType);

            apt.setSsfNumber(discountsAllowed ? request.getSsfNumber() : null);
            apt.setInsuranceProvider(discountsAllowed ? request.getInsuranceProvider() : null);
            apt.setInsurancePolicyNumber(discountsAllowed ? request.getInsurancePolicyNumber() : null);
            apt.setStaffId(discountsAllowed ? request.getStaffId() : null);
            apt.setVerifiedStaffName(discountsAllowed ? request.getVerifiedStaffName() : null);


            if ("APPOINTMENT".equalsIgnoreCase(bookingType)) {
                apt.setStatus("CONFIRMED");
            } else {
                apt.setStatus("COMPLETED");
                apt.setAppointmentTime(null);
            }

            Appointment saved = appointmentRepository.save(apt);

            String token = saved.getTokenNumber();
            String type = (token != null && token.startsWith("OPD"))
                    ? "OPD Ticket"
                    : "Doctor Appointment";

            if (!isPayAtCounter) {
                notificationService.createInAppNotification(
                        saved.getPatientId(),
                        "Payment Successful",
                        String.format("Your %s (Token: %s) payment of Rs. %.0f completed.",
                                type, token, payable),
                        "payment"
                );
            }

            Optional<Patient> patient = patientRepository.findByPhoneNumber(request.getPhoneNumber());
            if (patient.isPresent()) {
                createLabRequestIfApplicable(
                        bookingType,
                        request.getPatientName(),
                        patient.get().getId(),
                        request.getDoctorName(),
                        saved.getTokenNumber()
                );
            }

            sendConfirmationNotification(saved, isPayAtCounter);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("receiptId", saved.getId() + "-" + System.currentTimeMillis());
            response.put("tokenNumber", saved.getTokenNumber());
            response.put("payableAmount", payable);
            response.put("coveredAmount", covered);
            response.put(
                    "message",
                    isPayAtCounter
                            ? "Booking Reserved. Pay at Counter."
                            : "Payment Successful. Booking Confirmed."
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Payment failed: " + e.getMessage()
            ));
        }
    }



    private void createLabRequestIfApplicable(
            String bookingType,
            String patientName,
            Long patientId,
            String doctorName,
            String receiptNumber) {
        if (bookingType != null && bookingType.startsWith("LAB")) {
            Patient patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found for Lab Request"));

            LabTestRequest req = new LabTestRequest();
            req.setPatient(patient);
            req.setDoctorName(doctorName);
            req.setReceiptNumber(receiptNumber);
            req.setStatus("PAID");

            if (bookingType.contains("CBC")) {
                req.setTestName("Complete Blood Count");
                req.setTestCode("LAB-CBC");
                req.setSampleType("Blood (EDTA Vial)");
                req.setParameters(List.of(
                        new LabTestRequest.TestParameter("Hemoglobin", "g/dL", "13.0-17.0"),
                        new LabTestRequest.TestParameter("WBC Count", "/cmm", "4000-11000"),
                        new LabTestRequest.TestParameter("Platelets", "lakh/cmm", "1.5-4.5")
                ));
            } else if (bookingType.contains("URINE")) {
                req.setTestName("Urine R/E");
                req.setTestCode("LAB-URINE");
                req.setSampleType("Urine");
                req.setParameters(List.of(
                        new LabTestRequest.TestParameter("Color", "", "Pale Yellow"),
                        new LabTestRequest.TestParameter("Ph", "", "5.0-8.0"),
                        new LabTestRequest.TestParameter("Sugar", "", "Nil")
                ));
            }

            labRepository.save(req);
        }
    }

    private void sendConfirmationNotification(Appointment apt, boolean isPayAtCounter) {
        String name = apt.getPatientName();
        String token = apt.getTokenNumber();
        String type = (token != null && token.startsWith("OPD")) ? "OPD Ticket" : "Doctor Appointment";
        String date = apt.getAppointmentDate() != null ? apt.getAppointmentDate().toString() : "Today";

        String smsBody;
        String emailSubject;
        String emailBody;

        if (isPayAtCounter) {
            smsBody = String.format(
                    "HospiSmart: Your %s is RESERVED.\nToken: %s\nDate: %s\nPlease pay NPR %.0f at the counter.",
                    type, token, date, apt.getPayableAmount()
            );
            emailSubject = "Booking Reserved - Pay at Counter";
            emailBody = String.format(
                    "<h2>Booking Reserved</h2><p>Dear %s,</p><p>Your %s is reserved. Token: %s. Please pay NPR %.2f at counter.</p>",
                    name, type, token, apt.getPayableAmount()
            );
        } else {
            smsBody = String.format(
                    "HospiSmart: Payment Successful!\n%s Confirmed.\nToken: %s\nDate: %s\nThank you.",
                    type, token, date
            );
            emailSubject = "Booking Confirmed";
            emailBody = String.format(
                    "<h2>Booking Confirmed</h2><p>Dear %s,</p><p>Your %s is confirmed. Token: %s. Paid: NPR %.2f.</p>",
                    name, type, token, apt.getPaidAmount()
            );
        }

        String phone = apt.getPatientPhone();
        if (phone != null && !phone.isEmpty()) {
            if (!phone.startsWith("+")) phone = "+977" + phone;
            try {
                notificationService.sendSms(phone, smsBody);
            } catch (Exception e) {
                System.out.println("SMS Failed: " + e.getMessage());
            }
        }

        String email = apt.getPatientEmail();
        if (email != null && !email.isEmpty()) {
            try {
                notificationService.sendEmail(email, emailSubject, emailBody);
            } catch (Exception e) {
                System.out.println("Email Failed: " + e.getMessage());
            }
        }
    }

    @PostMapping("/pay-bill")
    public ResponseEntity<?> payPendingBill(@RequestBody PatientBillPaymentRequest req) {
        try {
            String bookingType = req.getBookingType() != null ? req.getBookingType().toUpperCase() : "GENERAL";
            double amountPaid = req.getPayableAmount() > 0 ? req.getPayableAmount() : req.getAmount();

            Billing billing = new Billing();
            billing.setPatientId(req.getPatientId());
            billing.setPatientName(req.getPatientName());
            billing.setPatientPhone(req.getPatientPhone());
            billing.setPatientEmail(req.getPatientEmail());

            String receiptId = "BILL-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                    "-" + String.format("%04d", billingRepository.count() + 1);
            billing.setReceiptId(receiptId);

            billing.setServiceName(getServiceDisplayName(bookingType, req.getBookingToken()));
            billing.setDepartment(req.getDepartment());
            billing.setTokenNumber(req.getBookingToken());

            billing.setOriginalAmount(req.getAmount());
            billing.setDiscountAmount(req.getCoveredAmount());
            billing.setFinalAmount(amountPaid);
            billing.setPaymentMethod(req.getPaymentMethod());
            billing.setPaymentStatus("PAID");
            billing.setPaymentDate(LocalDateTime.now());
            billing.setPaymentType(req.getPaymentType());

            billingRepository.save(billing);

            if ("OPD".equals(bookingType) || "APPOINTMENT".equals(bookingType)) {
                Appointment apt = appointmentRepository.findByTokenNumber(req.getBookingToken())
                        .orElse(null);
                if (apt != null) {
                    apt.setPaymentStatus("PAID");
                    apt.setPaidAmount(amountPaid);
                    appointmentRepository.save(apt);
                }
            }
            else if ("IPD".equals(bookingType)) {
                IpdPatient ipd = ipdPatientRepository.findByPatientId(req.getPatientId())
                        .orElseThrow(() -> new RuntimeException("IPD record not found"));

                ipd.setDepositBalance(ipd.getDepositBalance() + amountPaid);
                ipdPatientRepository.save(ipd);
            }

            if (notificationService != null) {
                String msg = String.format("Payment of Rs. %.2f successful for %s. Receipt: %s",
                        amountPaid, bookingType, receiptId);
                notificationService.sendSms(req.getPatientPhone(), msg);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "receiptId", receiptId,
                    "message", "Payment completed successfully",
                    "amountPaid", amountPaid
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    private String getServiceDisplayName(String type, String token) {
        if ("IPD".equals(type)) return "IPD Payment / Deposit";
        if (token != null && token.startsWith("OPD")) return "OPD Consultation";
        return type + " Service";
    }
}