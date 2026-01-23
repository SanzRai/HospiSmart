package com.example.hospismart.config;


import com.example.hospismart.dto.AdmissionRequest;
import com.example.hospismart.model.Bed;
import com.example.hospismart.model.SsfContributor;
import com.example.hospismart.model.SsfRate;
import com.example.hospismart.repository.AdmissionRespository;
import com.example.hospismart.repository.BedRepository;
import com.example.hospismart.repository.SsfContributorRepository;
import com.example.hospismart.repository.SsfRateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private SsfContributorRepository contributorRepository;

    @Autowired
    private SsfRateRepository ssfRateRepository;

    @Autowired
    private AdmissionRespository admissionRepo;

    @Autowired
    private BedRepository bedRepository;

    @Override
    public void run(String... args) throws Exception {

        // 1. Seed SSF Rates (Existing Logic)
        if (ssfRateRepository.count() == 0) {
            System.out.println("Seeding SSF Rates...");
            ssfRateRepository.saveAll(List.of(
                    createRate("OPD-GEN",    "General OPD",              500,  480),
                    createRate("OPD-SPEC",   "Specialist OPD",           1200, 900),
                    createRate("APT-GEN",    "General Appointment",      1000, 800),
                    createRate("APT-SPEC",   "Specialist Appointment",   1500, 1100),
                    createRate("LAB-CBC",    "Complete Blood Count",      600,  450),
                    createRate("LAB-URINE",  "Urine Test",                400,  300),
                    createRate("RAD-XRAY",   "Chest X-Ray",              1200, 900),
                    createRate("RAD-USG",    "Ultrasound",               2500, 2000),
                    createRate("PHARM-MED",  "Medicines",                5000, 4000),
                    createRate("PROC-DRESS", "Wound Dressing",           800,  600)
            ));
        }

        // 2. Seed SSF Contributors (Existing Logic)
        if (contributorRepository.count() == 0) {
            System.out.println("Seeding SSF Contributors...");
            contributorRepository.saveAll(List.of(
                    new SsfContributor("11111111111", true, 15000.0, 80000.0),
                    new SsfContributor("22222222222", true, 5000.0, 60000.0),
                    new SsfContributor("33333333333", false, 0.0, 0.0),
                    new SsfContributor("99999999999", true, 20000.0, 95000.0)
            ));
        }

        // 3. Seed Admission Requests (NEW LOGIC for Nurse Module)
        if (admissionRepo.count() == 0) {
            System.out.println("Seeding Admission Requests...");

            AdmissionRequest req1 = new AdmissionRequest();
            req1.setPatientName("Suresh Thapa");
            req1.setDoctorName("Dr. Anil");
            req1.setAdmissionReason("High Fever - Dengue Observation");
            req1.setRequestedWard("General Ward");
            req1.setPriority("Normal");
            req1.setStatus("PENDING");
            admissionRepo.save(req1);

            AdmissionRequest req2 = new AdmissionRequest();
            req2.setPatientName("Rita Ale");
            req2.setDoctorName("Dr. Meera");
            req2.setAdmissionReason("Post-Op Recovery");
            req2.setRequestedWard("ICU");
            req2.setPriority("Urgent");
            req2.setStatus("PENDING");
            admissionRepo.save(req2);
        }

        // 4. Seed Beds (NEW LOGIC for Nurse Module - Optional but recommended)
        if (bedRepository.count() == 0) {
            System.out.println("Seeding Beds...");
            for(int i=1; i<=10; i++) bedRepository.save(createBed("General Ward", "GW-0"+i));
            for(int i=1; i<=5; i++) bedRepository.save(createBed("ICU", "ICU-0"+i));
            for(int i=1; i<=5; i++) bedRepository.save(createBed("Cabin", "CB-0"+i));
        }
    }

    // Helper methods
    private SsfRate createRate(String code, String name, double standard, double ssfRate) {
        SsfRate rate = new SsfRate();
        rate.setServiceCode(code);
        rate.setServiceName(name);
        rate.setStandardRate(standard);
        rate.setSsfPrescribedRate(ssfRate);
        return rate;
    }

    private Bed createBed(String ward, String num) {
        Bed b = new Bed();
        b.setWard(ward);
        b.setBedNumber(num);
        b.setStatus("AVAILABLE");
        return b;
    }
}