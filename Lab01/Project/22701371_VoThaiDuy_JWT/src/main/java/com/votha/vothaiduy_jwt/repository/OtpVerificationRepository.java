package com.votha.vothaiduy_jwt.repository;

import com.votha.vothaiduy_jwt.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;


import java.time.LocalDateTime;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, String> {
    OtpVerification findOtpVerificationByOtp(String otp);
    void deleteByExpiredAtBefore(LocalDateTime time);
}
