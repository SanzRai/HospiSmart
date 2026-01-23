package com.example.hospismart.controller;

import com.example.hospismart.model.Appointment;
import com.example.hospismart.model.Doctor;
import com.example.hospismart.repository.AppointmentRepository;
import com.example.hospismart.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:3000")
public class TimeSlotController {
    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping("/{doctorId}/timeslots")
    public ResponseEntity<List<String>> getAvailableSlots(
            @PathVariable Long doctorId,
            @RequestParam("date") String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            Doctor doctor = doctorRepository.findById(doctorId).orElse(null);

            if (doctor == null || !doctor.isActive()) {
                return ResponseEntity.ok(List.of());
            }

            DayOfWeek dayOfWeek = date.getDayOfWeek();
            String dayAbbr = dayOfWeek.toString().substring(0, 3).charAt(0)
                    + dayOfWeek.toString().substring(1, 3).toLowerCase();


            String availableDays = doctor.getAvailableDays();

            boolean isAvailableToday = Arrays.stream(availableDays.split("[,\\s]+"))
                    .anyMatch(day -> day.trim().length() >= 2 &&
                            dayAbbr.toLowerCase().startsWith(day.trim().toLowerCase().substring(0, 2)));

            if (!isAvailableToday) {
                return ResponseEntity.ok(List.of("Doctor not available on " + dayAbbr));
            }

            LocalTime start = LocalTime.parse(doctor.getStartTime());
            LocalTime end = LocalTime.parse(doctor.getEndTime());
            int duration = doctor.getSlotDurationMinutes();

            List<String> allSlots = new ArrayList<>();
            LocalTime current = start;

            while (!current.isAfter(end)) {
                allSlots.add(current.toString());
                current = current.plusMinutes(duration);
            }

            List<Appointment> bookedAppointments = appointmentRepository
                    .findByAppointmentDate(date)
                    .stream()
                    .filter(a -> a.getDoctorName() != null &&
                            a.getDoctorName().trim().equalsIgnoreCase(doctor.getName().trim()))
                    .toList();

            Set<String> bookedTimes = bookedAppointments.stream()
                    .map(a -> a.getAppointmentTime().toString())
                    .collect(Collectors.toSet());

            List<String> availableSlots = allSlots.stream()
                    .filter(slot -> !bookedTimes.contains(slot))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(
                    availableSlots.isEmpty()
                            ? List.of("No slots available")
                            : availableSlots
            );

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of("Error generating slots"));
        }
    }
}
