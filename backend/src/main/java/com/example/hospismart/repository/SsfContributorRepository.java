package com.example.hospismart.repository;

import com.example.hospismart.model.SsfContributor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SsfContributorRepository extends JpaRepository <SsfContributor, String> {
    SsfContributor findBySsfId(String ssfId);
}
