package com.example.demo.productbank;

import com.example.demo.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "category_members")
@IdClass(CategoryMemberId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryMember {

    @Id
    @Column(name = "category_id")
    private UUID categoryId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, insertable = false, updatable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, insertable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "editor";

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}
