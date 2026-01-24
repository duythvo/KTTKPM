package com.votha.vothaiduy_jwt.repository;

import com.votha.vothaiduy_jwt.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {}
