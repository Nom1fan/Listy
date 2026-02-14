package com.listyyy.backend.list;

import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "list_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "list_id", nullable = false)
    private GroceryList list;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /** Direct category for custom items (no product). Null when item has a product. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "custom_name_he")
    private String customNameHe;

    @Column(nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(length = 50)
    @Builder.Default
    private String unit = "יחידה";

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "crossed_off", nullable = false)
    @Builder.Default
    private boolean crossedOff = false;

    @Column(name = "item_image_url", length = 2048)
    private String itemImageUrl;

    @Column(name = "icon_id", length = 64)
    private String iconId;

    @Column(name = "sort_order")
    @Builder.Default
    private int sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public String getDisplayName() {
        if (product != null) {
            return product.getNameHe();
        }
        return customNameHe != null ? customNameHe : "";
    }
}
