package com.example.hospismart.service;

import com.example.hospismart.dto.BillingRequest;
import com.example.hospismart.model.Billing;
import com.example.hospismart.repository.AppointmentRepository;
import com.example.hospismart.repository.BillingRepository;
import com.example.hospismart.repository.IpdPatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingRepository billingRepository;
    private final AppointmentRepository appointmentRepository;
    private final IpdPatientRepository ipdPatientRepository;

    public BillingRepository getBillingRepository() {
        return billingRepository;
    }


    public Billing createBilling(BillingRequest request) {
        Billing billing = new Billing();

        String receiptId = "REC-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MMdd")) +
                "-" + String.format("%04d", billingRepository.count() + 1);
        billing.setReceiptId(receiptId);

        billing.setPatientName(request.getPatientName());
        billing.setPatientPhone(request.getPatientPhone());
        billing.setPatientEmail(request.getPatientEmail());
        billing.setDepartment(request.getDepartment());
        billing.setServiceCode(request.getBookingType());
        billing.setServiceName(request.getBookingType().equals("OPD") ? "OPD Consultation" : "Doctor Appointment");

        billing.setOriginalAmount(request.getConsultingFee());
        billing.setDiscountAmount(request.getCoveredAmount());
        billing.setDiscountType(request.getPaymentType());
        billing.setDiscountDetails(getDiscountDetails(request));

        billing.setFinalAmount(request.getPayableAmount());
        billing.setPaymentMethod(request.getPaymentMethod());
        billing.setPaymentStatus("PAID");
        billing.setPaymentDate(LocalDateTime.now());

        billing.setTokenNumber(request.getBookingToken());
        billing.setSsfId(request.getSsfNumber());
        billing.setInsurancePolicy(request.getInsurancePolicyNumber());
        billing.setStaffId(request.getStaffId());

        return billingRepository.save(billing);
    }

    private String getDiscountDetails(BillingRequest req) {
        return switch (req.getPaymentType()) {
            case "SSF" -> "SSF Applied: NPR " + req.getCoveredAmount() + " covered";
            case "INSURANCE" -> "Insurance: " + req.getInsuranceProvider() + " covered " + req.getCoveredAmount();
            case "STAFF" -> "Staff Discount: " + req.getStaffId();
            default -> "No discount";
        };
    }
}