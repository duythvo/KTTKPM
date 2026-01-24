package com.votha.vothaiduy_jwt.service;

import java.util.List;

import com.votha.vothaiduy_jwt.dto.request.PermissionRequest;
import com.votha.vothaiduy_jwt.dto.response.PermissionResponse;
import com.votha.vothaiduy_jwt.entity.Permission;
import com.votha.vothaiduy_jwt.mapper.PermissionMapper;
import com.votha.vothaiduy_jwt.repository.PermissionRepository;
import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    public PermissionResponse createPermission(PermissionRequest request) {
        Permission permission = permissionMapper.toPermission(request);
        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    public List<PermissionResponse> getAllPermission() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toPermissionResponse)
                .toList();
    }

    public void delete(String name) {
        permissionRepository.deleteById(name);
    }
}
