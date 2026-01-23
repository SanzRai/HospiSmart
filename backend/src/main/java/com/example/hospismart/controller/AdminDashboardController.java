package com.example.hospismart.controller;

import com.example.hospismart.repository.AppointmentRepository;
import com.example.hospismart.repository.DepartmentRepository;
import com.example.hospismart.repository.DoctorRepository;
import com.example.hospismart.repository.PatientRepository;
import com.example.hospismart.model.Appointment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminDashboardController extends AdminBaseController {

    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!validateAdminTokenHeader(authHeader)) return ResponseEntity.status(401).body("Unauthorized");

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalDepartments", departmentRepository.count());
        summary.put("totalDoctors", doctorRepository.count());
        summary.put("totalPatients", patientRepository.count());

        // monthly appointments (this month)
        YearMonth now = YearMonth.now();
        LocalDate startOfMonth = now.atDay(1);
        LocalDate endOfMonth = now.atEndOfMonth();
        long monthlyAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getAppointmentDate()!=null && !a.getAppointmentDate().isBefore(startOfMonth) && !a.getAppointmentDate().isAfter(endOfMonth))
                .count();
        summary.put("monthlyAppointments", monthlyAppointments);

        // build appointmentTrend for last 6 months
        List<Map<String, Object>> trend = new ArrayList<>();
        YearMonth iter = now.minusMonths(5);
        for (int i = 0; i < 6; i++) {
            YearMonth ym = iter.plusMonths(i);
            LocalDate s = ym.atDay(1);
            LocalDate e = ym.atEndOfMonth();
            long cnt = appointmentRepository.findAll().stream()
                    .filter(a -> a.getAppointmentDate()!=null && !a.getAppointmentDate().isBefore(s) && !a.getAppointmentDate().isAfter(e))
                    .count();
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", ym.getMonth().toString().substring(0,3) + " " + ym.getYear());
            entry.put("count", cnt);
            trend.add(entry);
        }

        Map<String,Object> resp = new HashMap<>();
        resp.put("summary", summary);
        resp.put("appointmentTrend", trend);
        return ResponseEntity.ok(resp);
    }
}
