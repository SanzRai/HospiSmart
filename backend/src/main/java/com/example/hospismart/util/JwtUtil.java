package com.example.hospismart.util;

import com.example.hospismart.model.Doctor;
import com.example.hospismart.model.Staff;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);


    public String generateAdminToken(String username) {
        return Jwts.builder()
                .setClaims(Map.of("role", "ADMIN"))
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000))
                .signWith(key)
                .compact();
    }

    public String generateDoctorToken(Doctor doctor) {
        return Jwts.builder()
                .setClaims(Map.of(
                        "role", "DOCTOR",
                        "doctorId", doctor.getId(),
                        "name", doctor.getName(),
                        "departmentId", doctor.getDepartmentId()
                ))
                .setSubject(doctor.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 12 * 60 * 60 * 1000)) // 12 hours
                .signWith(key)
                .compact();
    }

    public String generateStaffToken(Staff staff) {
        return Jwts.builder()
                .setClaims(Map.of(
                        "role", "STAFF",
                        "staffId", staff.getId(),
                        "employeeId", staff.getEmployeeId(),
                        "name", staff.getName(),
                        "department", staff.getDepartment() != null ? staff.getDepartment() : ""
                ))
                .setSubject(staff.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 12 * 60 * 60 * 1000)) // 12 hours
                .signWith(key)
                .compact();
    }
    public String generatePatientToken(String phoneNumber, Long userId) {
        return Jwts.builder()
                .setClaims(Map.of(
                        "phoneNumber", phoneNumber,
                        "userId", userId,
                        "role", "PATIENT"
                ))
                .setSubject(phoneNumber)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 hours
                .signWith(key)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public Long extractStaffId(String token) {
        return extractAllClaims(token).get("staffId", Long.class);
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractPhoneNumber(String token) {

        return extractAllClaims(token).get("phoneNumber", String.class);
    }

    public Long extractUserId(String token) {

        return extractAllClaims(token).get("userId", Long.class);
    }

    public boolean isTokenExpired(String token) {

        return extractAllClaims(token).getExpiration().before(new Date());
    }

    public boolean validateToken(String token, String phoneNumber) {
        return phoneNumber.equals(extractPhoneNumber(token)) && !isTokenExpired(token);
    }


}