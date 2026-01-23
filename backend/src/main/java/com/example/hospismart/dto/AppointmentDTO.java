package com.example.hospismart.dto;
import com.example.hospismart.model.Address;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentDTO {
    // Patient Info
    private String patientName;
    private String patientPhone;
    private String patientEmail;
    private String patientDob;
    private String patientGender;
    private Address address;

    // Booking Info
    private String bookingType;
    private String doctorName;
    private String department;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String symptoms;

    // Payment Info
    private Double consultingFee;
    private Double coveredAmount;
    private Double payableAmount;
    private String paymentType;
    private String paymentMethod;
    private String status;
}