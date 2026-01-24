package com.votha.vothaiduy_jwt.repository;

import com.votha.vothaiduy_jwt.entity.SeatStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatStatusRepository extends JpaRepository<SeatStatus, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s FROM SeatStatus s
        WHERE s.trip.tripId = :tripId
        AND s.seatNumber IN :seatNumbers
    """)
    List<SeatStatus> lockSeats(
            @Param("tripId") String tripId,
            @Param("seatNumbers") List<String> seatNumbers
    );
}

