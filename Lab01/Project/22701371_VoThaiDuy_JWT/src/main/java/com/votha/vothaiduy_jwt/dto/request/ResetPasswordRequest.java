package com.votha.vothaiduy_jwt.dto.request;

import com.votha.vothaiduy_jwt.validator.PasswordConstraint;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {
    String email;

    @PasswordConstraint
    String newPassword;
    String resetToken;
}
