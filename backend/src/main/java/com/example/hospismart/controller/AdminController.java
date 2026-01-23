package com.example.hospismart.controller;

import com.example.hospismart.dto.AdminLoginRequest;
import com.example.hospismart.dto.AdminLoginResponse;
import com.example.hospismart.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "admin";

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest request) {
        System.out.println("Admin login attempt: " + request.getUsername());
        if (ADMIN_USERNAME.equals(request.getUsername()) &&
                ADMIN_PASSWORD.equals(request.getPassword())) {

            String token = jwtUtil.generateAdminToken(request.getUsername());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "token", token,
                    "role", "ADMIN",
                    "userId", 1L,
                    "adminId", 1L
            ));
        }

        return ResponseEntity.status(401)
                .body(Map.of("message", "Invalid username or password"));
    }

}

