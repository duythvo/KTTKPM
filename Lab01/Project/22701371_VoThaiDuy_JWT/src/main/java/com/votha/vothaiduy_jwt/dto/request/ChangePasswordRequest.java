package com.votha.vothaiduy_jwt.dto.request;

import com.votha.vothaiduy_jwt.validator.PasswordConstraint;
import lombok.*;
import lombok.experimental.FieldDefaults;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangePasswordRequest {
    String oldPassword;

    @PasswordConstraint
    String newPassword;
}
