package com.example.hospismart.controller;

import com.example.hospismart.dto.AdmissionRequest;
import com.example.hospismart.dto.LabTestRequest;
import com.example.hospismart.model.*;
import com.example.hospismart.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/doctor-portal")
@CrossOrigin(origins = "http://localhost:3000")
public class DoctorPortalController {
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private OpdRepository opdRepository;
    @Autowired
    private LabRepository labRepository;

    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private IpdPatientRepository ipdPatientRepository;
    @Autowired
    private DailyProgressNoteRepository progressNoteRepository;
    @Autowired
    private DischargeSummaryRepository dischargeRepository;
    @Autowired
    private AdmissionRespository admissionRespository;

    @Autowired
    private BedRepository bedRepository;


    @GetMapping("/appointments/{doctorId}")
    public ResponseEntity<?> getOpdQueue(@PathVariable Long doctorId) {

        List<Appointment> list = appointmentRepository.findAll().stream()
                .filter(a -> ("PAID".equalsIgnoreCase(a.getPaymentStatus()) || "CONFIRMED".equalsIgnoreCase(a.getStatus()))
                        && !"COMPLETED".equalsIgnoreCase(a.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/queue/{doctorId}")
    public ResponseEntity<?> getDoctorQueue(@PathVariable Long doctorId) {
        List<Appointment> appointments = appointmentRepository.findAll().stream()
                .filter(a -> Objects.equals(a.getDoctorId(), doctorId))
                .filter(a -> ("PAID".equalsIgnoreCase(a.getPaymentStatus()) || "CONFIRMED".equalsIgnoreCase(a.getStatus()))
                        && !"COMPLETED".equalsIgnoreCase(a.getStatus())
                        && !"ABSENT".equalsIgnoreCase(a.getStatus()))
                .collect(Collectors.toList());

        List<OpdTicket> opdTickets = opdRepository.findAll().stream()
                .filter(t -> t.getAssignedDoctorId() != null && t.getAssignedDoctorId().equals(doctorId))
                .filter(t -> "ASSIGNED".equalsIgnoreCase(t.getStatus()) ||
                        "VITALS_DONE".equalsIgnoreCase(t.getStatus()) ||
                        "ISSUED".equalsIgnoreCase(t.getStatus()))  // ← Add ISSUED as fallback
                .filter(t -> !"COMPLETED".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());

        List<Map<String, Object>> queue = new ArrayList<>();

        for (Appointment apt : appointments) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", apt.getId());
            map.put("type", "APPOINTMENT");
            map.put("patientName", apt.getPatientName());
            map.put("tokenNumber", apt.getTokenNumber());
            map.put("status", apt.getStatus());
            map.put("patientId", apt.getPatientId());
            queue.add(map);
        }

        for (OpdTicket t : opdTickets) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("type", "OPD");
            map.put("patientName", t.getName());
            map.put("tokenNumber", t.getTicketNumber());
            map.put("status", t.getStatus());
            map.put("patientId", t.getPatientId());
            queue.add(map);
        }

        return ResponseEntity.ok(queue);
    }

    @PostMapping("/prescribe")
    public ResponseEntity<?> savePrescription(@RequestBody Prescription prescription) {
        Prescription saved = prescriptionRepository.save(prescription);

        if (prescription.getAppointmentId() != null) {
            appointmentRepository.findById(prescription.getAppointmentId()).ifPresent(apt -> {
                apt.setStatus("COMPLETED");
                appointmentRepository.save(apt);
            });
        }


        if ("admit".equalsIgnoreCase(prescription.getOutcome())) {
            AdmissionRequest request = new AdmissionRequest();
            request.setPatientName(prescription.getPatientName());
            request.setPatientId(prescription.getPatientId());
            request.setDoctorName(prescription.getDoctorName());
            request.setAdmissionReason(prescription.getDiagnosis());
            request.setRequestedWard(prescription.getAdmissionWard());
            request.setPriority("Normal");
            request.setStatus("PENDING");
            admissionRespository.save(request);
        }

        if (prescription.getLabTests() != null && !prescription.getLabTests().isEmpty()) {
            Patient patient = patientRepository.findById(prescription.getPatientId()).orElse(null);

            if(patient != null) {
                for (String testName : prescription.getLabTests()) {
                    LabTestRequest labReq = new LabTestRequest();
                    labReq.setPatient(patient);
                    labReq.setDoctorName(prescription.getDoctorName());
                    labReq.setTestName(testName);
                    labReq.setTestName("PENDING PAYMENT");
                    labReq.setStatus("PAID");
                    labReq.setTestCode("DOC-ORDER");
                    labReq.setParameters(List.of(new LabTestRequest.TestParameter("Result", "", "Normal")));
                    labRepository.save(labReq);

                    Notification notification = new Notification();
                    notification.setPatientId(patient.getId());
                    notification.setTitle("New Lab Test Ordered");
                    notification.setMessage(("Dr. " + prescription.getDoctorName() +
                            " has ordered: " + testName +
                            ". Please complete payment to proceed with sample collection."));
                    notification.setType("LAB_PAYMENT_PENDING");
                    notification.setCreatedAt(LocalDateTime.now());
                    notification.setRead(false);
                    notificationRepository.save(notification);
                }
            }
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/history/{patientId}")
    public ResponseEntity<?> getPatientHistory(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionRepository.findByPatientId(patientId));
    }

    @GetMapping("/ipd/patients")
    public ResponseEntity<?> getAdmittedPatients() {
        return ResponseEntity.ok(ipdPatientRepository.findAll());
    }

    @PostMapping("/ipd/progress")
    public ResponseEntity<?> saveProgressNote(@RequestBody DailyProgressNote note) {
        note.setRoundTime(LocalDateTime.now());
        return ResponseEntity.ok(progressNoteRepository.save(note));
    }

    @GetMapping("/ipd/patient/{ipdId}/notes")
    public ResponseEntity<?> getProgressNotes(@PathVariable Long ipdId) {
        return ResponseEntity.ok(progressNoteRepository.findByIpdPatientIdOrderByRoundTimeDesc(ipdId));
    }

    @PostMapping("/ipd/discharge")
    public ResponseEntity<?> saveDischargeSummary(@RequestBody DischargeSummary summary) {
        DischargeSummary saved = dischargeRepository.save(summary);

         ipdPatientRepository.findById(summary.getIpdPatientId()).ifPresent(p -> {
             p.setStatus("DISCHARGED");
             ipdPatientRepository.save(p);

             bedRepository.findAll().stream()
                     .filter(b -> "OCCUPIED".equals(b.getStatus()) &&
                             Objects.equals(b.getCurrentPatientId(), p.getPatientId()))
                     .findFirst()
                     .ifPresent(bed -> {
                         bed.setStatus("AVAILABLE");
                         bed.setCurrentPatientId(null);
                         bed.setCurrentPatientName(null);
                         bed.setAdmissionDate(null);
                         bedRepository.save(bed);
                     });
         });

        return ResponseEntity.ok(saved);
    }
}