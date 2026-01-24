package com.votha.vothaiduy_jwt.repository;

import com.votha.vothaiduy_jwt.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
}

