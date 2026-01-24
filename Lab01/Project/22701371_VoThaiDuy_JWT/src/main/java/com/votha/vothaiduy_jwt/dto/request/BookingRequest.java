package com.votha.vothaiduy_jwt.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class BookingRequest {
    private String userId;
    private String tripId;
    private List<String> seatNumbers;
}
