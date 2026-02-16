package com.listyyy.backend.productbank;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "name_he", nullable = false)
    private String nameHe;

    @Column(name = "default_unit", length = 50)
    @Builder.Default
    private String defaultUnit = "יחידה";

    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    @Column(name = "icon_id", length = 64)
    private String iconId;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}
