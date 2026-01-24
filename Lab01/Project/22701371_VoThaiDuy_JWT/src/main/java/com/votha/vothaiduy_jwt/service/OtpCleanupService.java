package com.votha.vothaiduy_jwt.service;

import com.votha.vothaiduy_jwt.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpCleanupService {

    private final OtpVerificationRepository otpRepo;

    @Transactional
    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void cleanExpiredOtp() {
        otpRepo.deleteByExpiredAtBefore(LocalDateTime.now());
    }
}
