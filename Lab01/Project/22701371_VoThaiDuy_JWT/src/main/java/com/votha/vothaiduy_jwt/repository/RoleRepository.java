package com.votha.vothaiduy_jwt.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.votha.vothaiduy_jwt.entity.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {}
