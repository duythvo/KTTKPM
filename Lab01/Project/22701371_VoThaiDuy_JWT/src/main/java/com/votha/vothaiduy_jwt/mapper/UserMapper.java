package com.votha.vothaiduy_jwt.mapper;

import com.votha.vothaiduy_jwt.dto.request.UserCreationRequest;
import com.votha.vothaiduy_jwt.dto.request.UserUpdateRequest;
import com.votha.vothaiduy_jwt.dto.response.UserResponse;
import com.votha.vothaiduy_jwt.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "invalidatedTokens", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
