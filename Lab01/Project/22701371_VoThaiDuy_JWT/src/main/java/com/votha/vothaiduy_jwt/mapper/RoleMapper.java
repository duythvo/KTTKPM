package com.votha.vothaiduy_jwt.mapper;

import com.votha.vothaiduy_jwt.dto.request.RoleRequest;
import com.votha.vothaiduy_jwt.dto.response.RoleResponse;
import com.votha.vothaiduy_jwt.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
