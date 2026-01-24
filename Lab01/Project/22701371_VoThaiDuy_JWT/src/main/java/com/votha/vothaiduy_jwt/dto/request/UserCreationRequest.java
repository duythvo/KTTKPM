package com.votha.vothaiduy_jwt.dto.request;

import com.votha.vothaiduy_jwt.validator.PasswordConstraint;
import jakarta.validation.constraints.Email;
import lombok.*;
import lombok.experimental.FieldDefaults;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
    String username;

    @PasswordConstraint
    String password;

    @Email
    String email;
    String name;
    String address;
    String phoneNumber;
}
