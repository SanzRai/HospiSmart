package com.example.hospismart.service;

import com.example.hospismart.dto.AdminSettingsDTO;
import com.example.hospismart.model.AdminSettings;
import com.example.hospismart.repository.AdminSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class AdminSettingsService {

    private final AdminSettingsRepository repo;

    private final Long SETTINGS_ID = 1L;

    public AdminSettingsService(AdminSettingsRepository repo) {
        this.repo = repo;
    }

    public AdminSettingsDTO getSettings() {
        AdminSettings settings = repo.findById(SETTINGS_ID).orElseGet(() -> {
            AdminSettings def = AdminSettings.builder()
                    .id(SETTINGS_ID)
                    .hospitalName("My Hospital")
                    .tagline("Care You Can Trust")
                    .onlineBookingAllowed(true)
                    .defaultSlotMinutes(15)
                    .maxBookingsPerSlot(1)
                    .notifyEmail(true)
                    .notifySms(false)
                    .notifyWhatsapp(false)
                    .build();
            return repo.save(def);
        });

        return convertToDTO(settings);
    }

    public AdminSettingsDTO updateSettings(AdminSettingsDTO dto) {
        AdminSettings settings = repo.findById(SETTINGS_ID).orElse(new AdminSettings());
        settings.setId(SETTINGS_ID);


        settings.setHospitalName(dto.getHospitalName());
        settings.setTagline(dto.getTagline());
        settings.setAddress(dto.getAddress());
        settings.setPhone(dto.getPhone());
        settings.setEmergencyNo(dto.getEmergencyNo());
        settings.setEmail(dto.getEmail());
        settings.setGstin(dto.getGstin());
        settings.setLicenseNo(dto.getLicenseNo());

        settings.setGstRate(dto.getGstRate());
        settings.setOpdPrefix(dto.getOpdPrefix());
        settings.setIpdPrefix(dto.getIpdPrefix());
        settings.setPharmacyPrefix(dto.getPharmacyPrefix());

        settings.setDefaultSlotMinutes(dto.getDefaultSlotMinutes());
        settings.setMaxBookingsPerSlot(dto.getMaxBookingsPerSlot());
        settings.setOnlineBookingAllowed(dto.getOnlineBookingAllowed());

        if (dto.getNotifications() != null) {
            settings.setNotifyEmail(dto.getNotifications().getEmail());
            settings.setNotifySms(dto.getNotifications().getSms());
            settings.setNotifyWhatsapp(dto.getNotifications().getWhatsapp());
        } else {
            settings.setNotifyEmail(false);
            settings.setNotifySms(false);
            settings.setNotifyWhatsapp(false);
        }

        AdminSettings saved = repo.save(settings);
        return convertToDTO(saved);
    }

    private AdminSettingsDTO convertToDTO(AdminSettings entity) {
        AdminSettingsDTO dto = new AdminSettingsDTO();

        dto.setHospitalName(entity.getHospitalName());
        dto.setTagline(entity.getTagline());
        dto.setAddress(entity.getAddress());
        dto.setPhone(entity.getPhone());
        dto.setEmergencyNo(entity.getEmergencyNo());
        dto.setEmail(entity.getEmail());
        dto.setGstin(entity.getGstin());
        dto.setLicenseNo(entity.getLicenseNo());

        dto.setGstRate(entity.getGstRate());
        dto.setOpdPrefix(entity.getOpdPrefix());
        dto.setIpdPrefix(entity.getIpdPrefix());
        dto.setPharmacyPrefix(entity.getPharmacyPrefix());

        dto.setDefaultSlotMinutes(entity.getDefaultSlotMinutes());
        dto.setMaxBookingsPerSlot(entity.getMaxBookingsPerSlot());
        dto.setOnlineBookingAllowed(entity.getOnlineBookingAllowed());

        AdminSettingsDTO.Notifications n = new AdminSettingsDTO.Notifications();
        n.setEmail(entity.getNotifyEmail() != null && entity.getNotifyEmail());
        n.setSms(entity.getNotifySms() != null && entity.getNotifySms());
        n.setWhatsapp(entity.getNotifyWhatsapp() != null && entity.getNotifyWhatsapp());
        dto.setNotifications(n);

        return dto;
    }
}