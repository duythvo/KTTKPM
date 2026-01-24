package com.votha.vothaiduy_jwt.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String name;
    String email;
    String address;
    String phoneNumber;
    Boolean noPassword;
    Boolean isActive;
    Set<RoleResponse> roles;
}
