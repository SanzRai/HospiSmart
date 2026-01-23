package com.example.hospismart.service;

import com.example.hospismart.model.Notification;
import com.example.hospismart.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;


    @Autowired
    public NotificationService(
            JavaMailSender mailSender,
            NotificationRepository notificationRepository) {
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
    }


    public Notification createInAppNotification(
            Long patientId,
            String title,
            String message,
            String type) {

        if (patientId == null || patientId <= 0) {
            System.err.println("Cannot create notification: invalid patientId");
            return null;
        }

        Notification notification = new Notification();
        notification.setPatientId(patientId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type != null ? type : "info");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }


    public void notifyPatient(
            Long patientId,
            String title,
            String message,
            String type,
            String phoneNumber,
            String email,
            boolean sendSms,
            boolean sendEmail) {

        createInAppNotification(patientId, title, message, type);


        if (sendSms && phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            sendSms(phoneNumber, title + "\n" + message);
        }

        if (sendEmail && email != null && !email.trim().isEmpty()) {
            sendEmail(email, title, message);
        }
    }


    public void sendSms(String to, String messageBody) {
        System.out.println("==================================================");
        System.out.println(" [SMS GATEWAY MOCK] Sending Message...");
        System.out.println("--------------------------------------------------");
        System.out.println("TO      : " + to);
        System.out.println("FROM    : " + "HospiSmart");
        System.out.println("CONTENT : " + messageBody);
        System.out.println("STATUS  : SENT ");
        System.out.println("==================================================");
    }

    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            message.setFrom("rairoshani321@gmail.com"); // ← Consider making this configurable
            mailSender.send(message);
            System.out.println("Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }


    private String normalizePhone(String phone) {
        if (phone == null) return null;
        phone = phone.trim().replaceAll("[^0-9+]", "");
        if (phone.startsWith("0")) {
            return "+977" + phone.substring(1);
        }
        if (!phone.startsWith("+")) {
            return "+977" + phone;
        }
        return phone;
    }
}