package com.example.hospismart.controller;

import com.example.hospismart.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AdminBaseController {

    @Autowired
    protected JwtUtil jwtUtil;

    protected boolean validateAdminTokenHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;

        String token = authHeader.substring(7).trim();

        try {
            jwtUtil.extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
