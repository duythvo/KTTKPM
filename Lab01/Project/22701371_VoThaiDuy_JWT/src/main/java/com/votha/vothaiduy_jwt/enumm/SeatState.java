package com.votha.vothaiduy_jwt.enumm;

import lombok.Getter;

@Getter
public enum SeatState {
    AVAILABLE("Available"),
    HELD("Held"),
    BOOKED("Booked");

    private final String message;

    SeatState(String message) {
        this.message = message;
    }
}
