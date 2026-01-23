package com.example.hospismart.controller;

import com.example.hospismart.dto.AdminSettingsDTO;
import com.example.hospismart.service.AdminSettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
@CrossOrigin(origins = "*")
public class AdminSettingsController {

    private final AdminSettingsService service;

    public AdminSettingsController(AdminSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public AdminSettingsDTO getSettings() {
        System.out.println("Fetching settings...");
        return service.getSettings();
    }

    @PutMapping
    public AdminSettingsDTO updateSettings(@RequestBody AdminSettingsDTO dto) {
        System.out.println("Updating settings for Hospital: " + dto.getHospitalName());
        return service.updateSettings(dto);
    }
}