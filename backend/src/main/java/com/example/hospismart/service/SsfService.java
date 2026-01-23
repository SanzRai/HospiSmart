package com.example.hospismart.service;

import com.example.hospismart.dto.SsfCheckResponse;
import com.example.hospismart.model.Billing;
import com.example.hospismart.model.SsfContributor;
import com.example.hospismart.model.SsfRate;
import com.example.hospismart.repository.BillingRepository;
import com.example.hospismart.repository.SsfContributorRepository;
import com.example.hospismart.repository.SsfRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class SsfService {

    private final SsfRateRepository rateRepository;
    private final SsfContributorRepository contributorRepository;
    private final BillingRepository billingRepository;

    public SsfCheckResponse checkSsfEligibility(String ssfId, String serviceCode, double hospitalFee) {
        SsfContributor contributor = contributorRepository.findBySsfId(ssfId);

        if (contributor == null || !contributor.isEligible()) {
            return new SsfCheckResponse(false, "Invalid or inactive SSF ID", hospitalFee, 0, 0, hospitalFee);
        }

        SsfRate rate = rateRepository.findByServiceCode(serviceCode);

        if (rate == null) {
            return new SsfCheckResponse(false, "Service not covered under SSF", hospitalFee, 0, 0, hospitalFee);
        }

        double approvedRate = rate.getSsfPrescribedRate();

        double calculationBaseAmount = Math.min(hospitalFee, approvedRate);

        double ssfCovers = calculationBaseAmount * 0.80;

        if (contributor.getRemainingOpdBalance() < ssfCovers) {
            return new SsfCheckResponse(false,
                    "Insufficient SSF balance (Available: NPR " + contributor.getRemainingOpdBalance() + ")",
                    hospitalFee, approvedRate, 0, hospitalFee);
        }

        double patientPays = hospitalFee - ssfCovers;

        return new SsfCheckResponse(
                true,
                "SSF Approved (80% Coverage Applied",
                hospitalFee,
                approvedRate,
                ssfCovers,
                Math.max(0, patientPays)
        );
    }


    private void saveUniversalBilling(String ssfId, String serviceCode, double originalAmount,
                                      double discountAmount, double finalAmount) {
        try {
            Billing billing = new Billing();

            String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            long count = billingRepository.count() + 1;
            String receiptId = "SSF-" + today + "-" + String.format("%04d", count);
            billing.setReceiptId(receiptId);

            SsfRate rate = rateRepository.findByServiceCode(serviceCode);
            billing.setServiceCode(serviceCode);
            billing.setServiceName(rate != null ? rate.getServiceName() : "SSF Service");
            billing.setOriginalAmount(originalAmount);
            billing.setDiscountAmount(discountAmount);
            billing.setDiscountType("SSF");
            billing.setDiscountDetails("SSF ID: " + ssfId + " | Approved Rate: NPR " +
                    rate.getSsfPrescribedRate());

            billing.setFinalAmount(finalAmount);
            billing.setPaymentStatus("PENDING_SSF");  
            billing.setSsfId(ssfId);
            billing.setCreatedAt(LocalDateTime.now());

            billingRepository.save(billing);
        } catch (Exception e) {
            System.out.println("SSF provisional billing failed: " + e.getMessage());
        }
    }
}