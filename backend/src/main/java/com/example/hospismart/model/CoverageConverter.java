package com.example.hospismart.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Map;

@Converter
public class CoverageConverter implements AttributeConverter<Map<String, Integer>, String> {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Map<String, Integer> attribute) {
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch(Exception e) {
            return "{}";
        }
    }

    @Override
    public Map<String, Integer> convertToEntityAttribute(String dbData) {
        try{
            return objectMapper.readValue(dbData, new TypeReference<Map<String, Integer>>() {});

            }catch (Exception e) {
            return Map.of();
        }
    }
}
