package com.english.server.repository;

import com.english.server.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByPhone(String phone);

    Optional<UserEntity> findByEmail(String email);
}
