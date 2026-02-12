package com.example.demo.productbank;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name_he", nullable = false)
    private String nameHe;

    @Column(name = "icon_id", length = 50)
    private String iconId;

    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    @Column(name = "sort_order")
    @Builder.Default
    private int sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}
