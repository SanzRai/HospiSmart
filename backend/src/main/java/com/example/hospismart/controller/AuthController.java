package com.example.hospismart.controller;

import com.example.hospismart.model.Patient;
import com.example.hospismart.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")

public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody Map<String, String> body) {
        String phoneNumber = body.get("phoneNumber");
        authService.sendOtp(phoneNumber);
        Map<String,String> response = new HashMap<>();
        response.put("message", "OTP sent successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> request) {
        String token = authService.verifyOtp(request.get("phoneNumber"), request.get("otp"));
        Map<String, String> response = Map.of("verificationToken", token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/complete-registration")
    public ResponseEntity<Patient> completeRegistration(@RequestHeader("Authorization") String authHeader, @RequestBody Patient patient) {
        String token = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(authService.completeRegistration(token, patient));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = authService.login(request.get("identifier"), request.get("password"));

        Map<String, Object> finalResponse = new HashMap<>(response);
        finalResponse.put("role", "PATIENT");
        finalResponse.put("success", true);
        finalResponse.put("message", "Login successful");

        return ResponseEntity.ok(finalResponse);
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<Map<String, String>> sendForgotOtp(@RequestBody Map<String, String> request) {
        authService.sendForgotOtp(request.get("phoneNumber"));
        Map<String, String> response = Map.of("message", "OTP sent successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<Map<String, String>> verifyForgotOtp(@RequestBody Map<String, String> request) {
        String token = authService.verifyForgotOtp(request.get("phoneNumber"), request.get("otp"));
        Map<String, String> response = Map.of("resetToken", token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        authService.resetPassword(request.get("resetToken"), request.get("newPassword"));
        Map<String, String> response = Map.of("message", "Password reset successful");
        return ResponseEntity.ok(response);
    }
}