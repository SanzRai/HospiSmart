package com.example.hospismart.repository;
import com.example.hospismart.model.DailyProgressNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DailyProgressNoteRepository extends JpaRepository<DailyProgressNote, Long> {
    List<DailyProgressNote> findByIpdPatientIdOrderByRoundTimeDesc(Long ipdPatientId);
}