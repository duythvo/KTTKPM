package com.votha.vothaiduy_jwt.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.votha.vothaiduy_jwt.entity.InvalidatedToken;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {}
