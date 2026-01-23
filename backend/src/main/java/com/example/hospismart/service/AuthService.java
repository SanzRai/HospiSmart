package com.example.hospismart.service;

import com.example.hospismart.model.Patient;
import com.example.hospismart.repository.PatientRepository;
import com.example.hospismart.util.JwtUtil;
import jakarta.transaction.Transactional;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AuthService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private NotificationService notificationService;

    private Map<String, String> otpStore = new HashMap<>();
    private Map<String, String> verificationTokenStore = new HashMap<>();

    public String sendOtp(String phoneNumber) {
        if (patientRepository.findByPhoneNumber(phoneNumber).isPresent()) {
            throw new RuntimeException("Phone number already registered");
        }
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(phoneNumber, otp);
        System.out.println("OTP for " + phoneNumber + ": " + otp);

        notificationService.sendSms("+977" + phoneNumber, "Your OTP for HospiSmart is: " + otp);

        return  "OTP sent succesfully";
    }

    public String verifyOtp(String phoneNumber, String otp) {
        if (otpStore.get(phoneNumber) != null && otpStore.get(phoneNumber).equals(otp)) {
            String verificationToken = UUID.randomUUID().toString();
            verificationTokenStore.put(verificationToken, phoneNumber);
            otpStore.remove(phoneNumber);
            return verificationToken;
        }
        throw new RuntimeException("Invalid OTP");
    }

    public Patient completeRegistration(String verificationToken, Patient patient) {
        String phone = verificationTokenStore.get(verificationToken);
        if (phone == null || !phone.equals(patient.getPhoneNumber())) {
            throw new RuntimeException("Invalid verification token");
        }
        patient.setPassword(BCrypt.hashpw(patient.getPassword(), BCrypt.gensalt()));
        verificationTokenStore.remove(verificationToken);
        return patientRepository.save(patient);
    }

    public Map<String, Object> login(String identifier, String password) {
        Optional<Patient> patientOpt = patientRepository.findByPhoneNumber(identifier);
        if (patientOpt.isEmpty()) {
            patientOpt = patientRepository.findByEmail(identifier);
        }

        Patient patient = patientOpt.orElseThrow(() -> new RuntimeException("Invalid Credentials"));

        if (!BCrypt.checkpw(password, patient.getPassword())) {
            throw new RuntimeException("Invalid Credentials");
        }

        String token = jwtUtil.generatePatientToken(patient.getPhoneNumber(), patient.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", patient.getId());
        response.put("patient", patient);
        response.put("message", "Login successful");

        return response;
    }

    public String sendForgotOtp(String phoneNumber) {
        if (patientRepository.findByPhoneNumber(phoneNumber).isEmpty()) {
            throw new RuntimeException("Phone number is not registered");
        }
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(phoneNumber, otp);
        System.out.println("Forgot OTP for " + phoneNumber + ": " + otp);
        return "OTP sent";
    }

    public String verifyForgotOtp(String phoneNumber, String otp) {
        if (otpStore.get(phoneNumber) != null && otpStore.get(phoneNumber).equals(otp)) {
            String resetToken = UUID.randomUUID().toString();
            verificationTokenStore.put(resetToken, phoneNumber);
            otpStore.remove(phoneNumber);
            return resetToken;
        }
        throw new RuntimeException("Invalid OTP");
    }


    public void resetPassword(String resetToken, String newPassword) {
        String phone = verificationTokenStore.get(resetToken);
        if (phone == null) {
            throw new RuntimeException("Invalid reset token");
        }
        try{
            Patient patient = patientRepository.findByPhoneNumber(phone).orElseThrow(() -> new RuntimeException("Patient not found"));
            patient.setPassword(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
            patientRepository.save(patient);
            verificationTokenStore.remove(resetToken);
            System.out.println("Password reset successful for" + phone);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Password reset failed: " + e.getMessage());
        }
    }
}