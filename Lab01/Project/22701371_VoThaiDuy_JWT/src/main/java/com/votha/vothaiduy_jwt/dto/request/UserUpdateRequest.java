package com.votha.vothaiduy_jwt.dto.request;

import com.votha.vothaiduy_jwt.validator.DobConstraint;
import lombok.*;
import lombok.experimental.FieldDefaults;


import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String name;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    List<String> roles;
}
