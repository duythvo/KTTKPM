package com.votha.vothaiduy_jwt.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "invalidted_token")
public class InvalidatedToken {
    @Id
    String id;

    Date expiryTime;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
