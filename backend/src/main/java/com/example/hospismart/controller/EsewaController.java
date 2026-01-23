package com.example.hospismart.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/esewa")
@CrossOrigin(origins = "http://localhost:3000")
public class EsewaController {

    private static final String PRODUCT_CODE = "EPAYTEST";
    private static final String STATUS_CHECK_URL = "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

    private final ObjectMapper mapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> dataMap;
            if (payload.containsKey("encodedData") && payload.get("encodedData") != null) {
                String encoded = payload.get("encodedData").toString();
                if (encoded.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "encodedData is empty"));
                }
                byte[] decoded = Base64.getDecoder().decode(encoded.getBytes(StandardCharsets.UTF_8));
                String decodedString = new String(decoded, StandardCharsets.UTF_8);
                dataMap = mapper.readValue(decodedString, Map.class);
                // debug log
                System.out.println("Decoded eSewa payload from encodedData: " + decodedString);
            } else {
                // assume payload is already JSON decoded form from frontend
                dataMap = payload;
                System.out.println("Received eSewa payload (decoded): " + mapper.writeValueAsString(dataMap));
            }

            String status = getString(dataMap, "status", "Status", "payment_status");
            String totalAmountRaw = getString(dataMap, "total_amount", "totalAmount", "amount", "totalAmountFormatted");
            String transactionUuid = getString(dataMap, "transaction_uuid", "transactionUuid", "transaction_uuid", "transaction_id", "referenceId");

            if (status == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing status in payload"));
            }

            if (!"COMPLETE".equalsIgnoreCase(status)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Transaction not complete", "status", status));
            }

            if (totalAmountRaw == null || transactionUuid == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing total_amount or transaction_uuid in payload"));
            }

            String totalAmount = totalAmountRaw.replace(",", "").trim();

            String checkUrl = String.format("%s?product_code=%s&total_amount=%s&transaction_uuid=%s",
                    STATUS_CHECK_URL, PRODUCT_CODE, totalAmount, transactionUuid);

            System.out.println("Calling eSewa status API: " + checkUrl);

            Map<String, Object> apiResponse = restTemplate.getForObject(checkUrl, Map.class);

            if (apiResponse == null) {
                return ResponseEntity.status(502).body(Map.of("success", false, "message", "No response from eSewa status API"));
            }

            String apiStatus = getString(apiResponse, "status", "Status");

            if ("COMPLETE".equalsIgnoreCase(apiStatus)) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Payment verified successfully",
                        "transaction_uuid", transactionUuid,
                        "esewa_status", apiStatus,
                        "esewa_response", apiResponse
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Verification API returned non-COMPLETE status",
                        "esewa_status", apiStatus,
                        "esewa_response", apiResponse
                ));
            }

        } catch (IllegalArgumentException iae) {
            iae.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid base64 encodedData", "error", iae.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Verification failed: " + e.getMessage()));
        }
    }

    private String getString(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            if (m.containsKey(k) && m.get(k) != null) {
                return m.get(k).toString();
            }
        }
        return null;
    }
}
