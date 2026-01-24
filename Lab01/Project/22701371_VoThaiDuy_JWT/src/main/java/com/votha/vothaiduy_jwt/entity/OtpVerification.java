package com.votha.vothaiduy_jwt.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verification")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class OtpVerification {

    @Id
    private String email;
    private String otp;
    private LocalDateTime expiredAt;
    private String resetToken;
    private LocalDateTime resetTokenExpiredAt;

}

