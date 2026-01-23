package com.example.hospismart.controller;

import com.example.hospismart.dto.SsfCheckResponse;
import com.example.hospismart.service.SsfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ssf")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class SsfController {
    private final SsfService ssfService;

    @GetMapping("/check")
    public ResponseEntity<SsfCheckResponse> check (
            @RequestParam String ssfId,
            @RequestParam String serviceCode,
            @RequestParam double fee
    ) {
        var response = ssfService.checkSsfEligibility(ssfId, serviceCode, fee);
        return ResponseEntity.ok(response);
    }
}
