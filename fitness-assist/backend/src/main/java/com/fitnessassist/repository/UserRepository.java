package com.fitnessassist.repository;

import com.fitnessassist.model.Role;
import com.fitnessassist.model.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);

    List<User> findByRoleOrderByCreatedAtDesc(Role role);

    Optional<User> findByIdAndRole(Long id, Role role);

    @Modifying
    @Query("update User u set u.role = :role where u.role is null")
    int backfillRole(@Param("role") Role role);

    @Modifying
    @Query("update User u set u.active = true where u.active is null")
    int backfillActive();
}
