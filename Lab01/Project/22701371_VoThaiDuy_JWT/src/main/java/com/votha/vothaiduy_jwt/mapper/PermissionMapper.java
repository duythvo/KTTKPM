package com.votha.vothaiduy_jwt.mapper;

import com.votha.vothaiduy_jwt.dto.request.PermissionRequest;
import com.votha.vothaiduy_jwt.dto.response.PermissionResponse;
import com.votha.vothaiduy_jwt.entity.Permission;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionResponse(Permission permission);
}
