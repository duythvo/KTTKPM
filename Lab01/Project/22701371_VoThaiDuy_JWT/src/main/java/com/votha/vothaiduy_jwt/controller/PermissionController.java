package com.votha.vothaiduy_jwt.controller;

import java.util.List;

import com.votha.vothaiduy_jwt.dto.request.PermissionRequest;
import com.votha.vothaiduy_jwt.dto.response.ApiResponse;
import com.votha.vothaiduy_jwt.dto.response.PermissionResponse;
import com.votha.vothaiduy_jwt.service.PermissionService;
import org.springframework.web.bind.annotation.*;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;


@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PermissionController {
    PermissionService permissionService;

    @PostMapping
    ApiResponse<PermissionResponse> createPermission(@RequestBody PermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .result(permissionService.createPermission(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<PermissionResponse>> getAll() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .result(permissionService.getAllPermission())
                .build();
    }

    @DeleteMapping("/{name}")
    ApiResponse<Void> delete(@PathVariable("name") String name) {
        permissionService.delete(name);
        return ApiResponse.<Void>builder().build();
    }
}
