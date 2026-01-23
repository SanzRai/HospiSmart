package com.example.hospismart.service;

import com.example.hospismart.model.InsuranceProvider;
import com.example.hospismart.model.PatientInsurance;
import com.example.hospismart.repository.InsuranceProviderRepository;
import com.example.hospismart.repository.PatientInsuranceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class InsuranceService {

    @Autowired
    private InsuranceProviderRepository providerRepository;

    @Autowired
    private PatientInsuranceRepository patientInsuranceRepository;

    public PatientInsurance getEligibleInsurance(Long patientId, String serviceType) {


        List<PatientInsurance> policies = patientInsuranceRepository.findActiveByPatientId(patientId);

        LocalDate today = LocalDate.now();

        for (PatientInsurance pi : policies) {
            InsuranceProvider ip = pi.getProvider();

            boolean isDateValid = (pi.getValidFrom().isBefore(today) || pi.getValidFrom().isEqual(today)) &&
                    (pi.getValidTo().isAfter(today) || pi.getValidTo().isEqual(today));

            if(ip.isActive() && isDateValid) {
                if (ip.isActive() && isDateValid) {
                    return pi;
                }
            }
        }
        return null;
    }

    public double applyDiscount(double fee, PatientInsurance insurance, String serviceType) {
        if (insurance == null) return fee;
        int coverage = insurance.getProvider().getCoverage().getOrDefault(serviceType, 0);
        return fee * (100 - coverage) / 100.0;
    }
}
