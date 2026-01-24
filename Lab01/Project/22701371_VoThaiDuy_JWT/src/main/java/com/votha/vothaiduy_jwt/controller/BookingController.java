package com.votha.vothaiduy_jwt.controller;

import com.votha.vothaiduy_jwt.dto.request.BookingRequest;
import com.votha.vothaiduy_jwt.entity.Booking;
import com.votha.vothaiduy_jwt.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> book(@RequestBody BookingRequest request) {
        Booking booking = bookingService.bookSeats(request);
        return ResponseEntity.ok(booking.getBookingId());
    }
}
