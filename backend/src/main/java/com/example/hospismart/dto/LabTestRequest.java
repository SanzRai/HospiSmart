package com.example.hospismart.dto;

import com.example.hospismart.model.Doctor;
import com.example.hospismart.model.Patient;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "lab_requests")
public class LabTestRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    private String doctorName;
    private String receiptNumber;
    private String testCode;
    private String testName;
    private String sampleType;
    private String status;
    private String collectedBy;
    private LocalDateTime collectionTime;
    private String enteredBy;
    private LocalDateTime entryTime;
    private String verifiedBy;
    private LocalDateTime verificationTime;


    @ElementCollection
    @CollectionTable(name = "lab_test_request_results",
            joinColumns = @JoinColumn(name = "lab_test_request_id"))
    @OrderColumn(name = "result_index") 
    private List<LabResult> results = new ArrayList<>();


    @ElementCollection
    @CollectionTable(name = "lab_test_request_parameters",
            joinColumns = @JoinColumn(name = "lab_test_request_id"))
    @OrderColumn(name = "parameter_index") 
    private List<TestParameter> parameters = new ArrayList<>();

    public String getPatientName() {
        return patient != null ? patient.getFullName() : "Unknown";
    }

    public Long getPatientId() {
        return patient != null ? patient.getId() : null;
    }


    @Embeddable
    @Data
    public static class LabResult {
        private String name;
        private String value;
        private String unit;
        private String normalRange;

        public LabResult() {}

        public LabResult(String name, String value, String unit, String normalRange) {
            this.name = name;
            this.value = value;
            this.unit = unit;
            this.normalRange = normalRange;
        }
    }


    @Embeddable
    @Data
    public static class TestParameter {
        private String name;
        private String unit;
        private String normalRange;

        public TestParameter() {}

        public TestParameter(String name, String unit, String normalRange) {
            this.name = name;
            this.unit = unit;
            this.normalRange = normalRange;
        }
    }
}