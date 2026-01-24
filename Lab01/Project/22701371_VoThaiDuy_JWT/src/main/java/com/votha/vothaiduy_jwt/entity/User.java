package com.votha.vothaiduy_jwt.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "users")
public class User implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    String id;

    String username;
    String password;
    String email;
    String name;
    String address;

    @Column(name = "phone_number")
    String phoneNumber;

    @Column(name = "is_active")
    Boolean isActive;

    @Column(name = "created_date")
    LocalDate createdDate;

    @ManyToMany
    @JoinTable(
            name = "users_roles",
            joinColumns = @JoinColumn(name = "user_user_id", referencedColumnName = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "roles_name", referencedColumnName = "name"))
    Set<Role> roles;


    @OneToMany(mappedBy = "user")
    @ToString.Exclude
    Set<InvalidatedToken> invalidatedTokens;

    @OneToMany(mappedBy = "user")
    private List<Booking> bookings;

}
