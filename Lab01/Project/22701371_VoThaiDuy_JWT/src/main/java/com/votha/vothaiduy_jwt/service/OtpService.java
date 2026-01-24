package com.votha.vothaiduy_jwt.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class OtpService {
    public String generateOTP() {
        return String.valueOf((int) (Math.random() * 900000) + 100000);
    }

    public LocalDateTime getExpiredTime() {
        return LocalDateTime.now().plusMinutes(1);
    }
}
