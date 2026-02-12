package com.example.demo.list;

import com.example.demo.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "list_members")
@IdClass(ListMemberId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListMember {

    @Id
    @Column(name = "list_id")
    private UUID listId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "list_id", nullable = false, insertable = false, updatable = false)
    private GroceryList list;

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
