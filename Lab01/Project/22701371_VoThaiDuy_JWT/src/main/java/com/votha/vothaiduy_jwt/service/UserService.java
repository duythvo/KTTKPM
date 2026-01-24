package com.votha.vothaiduy_jwt.service;

import com.votha.vothaiduy_jwt.constant.PredefinedRole;
import com.votha.vothaiduy_jwt.dto.request.*;
import com.votha.vothaiduy_jwt.dto.response.UserResponse;
import com.votha.vothaiduy_jwt.dto.response.VerifyOtpResponse;
import com.votha.vothaiduy_jwt.entity.OtpVerification;
import com.votha.vothaiduy_jwt.entity.Role;
import com.votha.vothaiduy_jwt.entity.User;
import com.votha.vothaiduy_jwt.exception.AppException;
import com.votha.vothaiduy_jwt.exception.ErrorCode;
import com.votha.vothaiduy_jwt.mapper.UserMapper;
import com.votha.vothaiduy_jwt.repository.OtpVerificationRepository;
import com.votha.vothaiduy_jwt.repository.RoleRepository;
import com.votha.vothaiduy_jwt.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;


import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;
    OtpService otpService;
    OtpVerificationRepository otpVerificationRepository;
    EmailService emailService;

    // CREATE
    public UserResponse createUser(UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) throw new AppException(ErrorCode.USER_EXISTED);
        if(userRepository.existsByEmail(request.getEmail())) throw new AppException(ErrorCode.EMAIL_EXISTED);

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById(PredefinedRole.USER_ROLE).ifPresent(roles::add);

        user.setRoles(roles);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        var userResponse = userMapper.toUserResponse(user);

        userResponse.setNoPassword(!StringUtils.hasText(user.getPassword()));

        return userResponse;
    }

    public void createPassword(PasswordCreationRequest request) {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (StringUtils.hasText(user.getPassword())) throw new AppException(ErrorCode.PASSWORD_EXISTED);

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
    }

    // UPDATE
    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        HashSet<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            roles.addAll(roleRepository.findAllById(request.getRoles()));
        }

        user.setRoles(roles);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    // DELETE
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void updateStatusUser(String id, Boolean isActive) {
        User user = userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setIsActive(isActive);
        userRepository.save(user);
    }


    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {

        User user = userRepository.findUserByEmail(request.getEmail());

        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        String otp = otpService.generateOTP();

        String existingOtp = otpVerificationRepository.findOtpVerificationByOtp(otp) != null ? otpService.generateOTP() : otp;

        emailService.sendOTP(request.getEmail(), existingOtp);

        OtpVerification otpVerification = new OtpVerification();
        otpVerification.setEmail(request.getEmail());
        otpVerification.setOtp(existingOtp);
        otpVerification.setExpiredAt(otpService.getExpiredTime());

        otpVerificationRepository.save(otpVerification);
    }

    //Verify OTP
    @Transactional
    public VerifyOtpResponse verifyOtp(OtpRequest request) {

        OtpVerification otpVerification = otpVerificationRepository.findById(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID));

        if (!otpVerification.getOtp().equals(request.getOtp())) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        if (otpVerification.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        String resetToken = UUID.randomUUID().toString();
        otpVerification.setResetToken(resetToken);
        otpVerification.setResetTokenExpiredAt(LocalDateTime.now().plusMinutes(10));

        otpVerificationRepository.save(otpVerification);

        return VerifyOtpResponse.builder()
                .resetToken(resetToken)
                .build();
    }


    // Reset Password
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        OtpVerification otp = otpVerificationRepository.findById(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID));

        if (!otp.getResetToken().equals(request.getResetToken())) {
            throw new AppException(ErrorCode.TOKEN_RESET_INVALID);
        }

        if (otp.getResetTokenExpiredAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.TOKEN_RESET_EXPIRED);
        }

        User user = userRepository.findUserByEmail(request.getEmail());
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpVerificationRepository.delete(otp);
    }

    //Change pássword
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_INCORRECT);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);
    }



    public UserResponse updateMyInfo(UserUpdateRequest request) {
        var context = SecurityContextHolder.getContext();
        String username = context.getAuthentication().getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        return userMapper.toUserResponse(userRepository.save(user));
    }

}
