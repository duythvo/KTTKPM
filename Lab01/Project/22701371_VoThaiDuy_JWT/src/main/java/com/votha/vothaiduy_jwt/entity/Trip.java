package com.votha.vothaiduy_jwt.entity;

import com.votha.vothaiduy_jwt.enumm.SeatState;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String tripId;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "total_seat")
    private int totalSeat;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL)
    private List<SeatStatus> seatStatuses;

}

