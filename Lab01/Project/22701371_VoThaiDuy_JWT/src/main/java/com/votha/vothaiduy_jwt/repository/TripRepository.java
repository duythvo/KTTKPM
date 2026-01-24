package com.votha.vothaiduy_jwt.repository;

import com.votha.vothaiduy_jwt.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, String> {
}
