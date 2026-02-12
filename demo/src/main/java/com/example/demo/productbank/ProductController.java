package com.example.demo.productbank;

import com.example.demo.auth.User;
import com.example.demo.list.ListItemRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ListItemRepository listItemRepository;

    @GetMapping
    public ResponseEntity<List<ProductDto>> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String search
    ) {
        List<Product> products;
        if (search != null && !search.isBlank()) {
            products = productRepository.findByNameHeContainingIgnoreCase(search.trim());
        } else if (categoryId != null) {
            products = productRepository.findByCategoryIdOrderByNameHe(categoryId);
        } else {
            products = productRepository.findAll(Sort.by("nameHe"));
        }
        Map<UUID, Long> addCountByProduct = getProductAddCounts();
        List<ProductDto> body = products.stream()
                .map(p -> toDto(p, addCountByProduct.getOrDefault(p.getId(), 0L)))
                .sorted((a, b) -> {
                    int c = Long.compare(b.getAddCount(), a.getAddCount());
                    return c != 0 ? c : a.getNameHe().compareTo(b.getNameHe());
                })
                .toList();
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> get(@PathVariable UUID id) {
        Map<UUID, Long> addCountByProduct = getProductAddCounts();
        return productRepository.findById(id)
                .map(p -> toDto(p, addCountByProduct.getOrDefault(p.getId(), 0L)))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ProductDto> create(
            @Valid @RequestBody CreateProductRequest req,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        var category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        String unit = req.getDefaultUnit() != null && !req.getDefaultUnit().isBlank()
                ? req.getDefaultUnit().trim() : "יחידה";
        String iconId = req.getIconId() != null && !req.getIconId().isBlank() ? req.getIconId().trim() : null;
        String imageUrl = req.getImageUrl() != null && !req.getImageUrl().isBlank() ? req.getImageUrl().trim() : null;
        Product p = Product.builder()
                .category(category)
                .nameHe(req.getNameHe().trim())
                .defaultUnit(unit)
                .iconId(iconId)
                .imageUrl(imageUrl)
                .build();
        p = productRepository.save(p);
        return ResponseEntity.ok(toDto(p, 0L));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        if (!productRepository.existsById(id)) return ResponseEntity.notFound().build();
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    @Transactional
    public ResponseEntity<ProductDto> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProductRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        Product p = productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        // imageUrl: set when provided; use empty string in request to clear
        if (req.getImageUrl() != null) p.setImageUrl(req.getImageUrl().isBlank() ? null : req.getImageUrl());
        // iconId: set when provided; use empty string in request to clear override
        if (req.getIconId() != null) p.setIconId(req.getIconId().isBlank() ? null : req.getIconId());
        p = productRepository.save(p);
        return ResponseEntity.ok(toDto(p, getProductAddCounts().getOrDefault(p.getId(), 0L)));
    }

    private Map<UUID, Long> getProductAddCounts() {
        return listItemRepository.countByProductId().stream()
                .collect(Collectors.toMap(
                        row -> toUuid(row[0]),
                        row -> ((Number) row[1]).longValue()
                ));
    }

    private static UUID toUuid(Object o) {
        if (o instanceof UUID) return (UUID) o;
        return UUID.fromString(o.toString());
    }

    private ProductDto toDto(Product p, long addCount) {
        return ProductDto.builder()
                .id(p.getId())
                .categoryId(p.getCategory().getId())
                .categoryNameHe(p.getCategory().getNameHe())
                .categoryIconId(p.getCategory().getIconId())
                .iconId(p.getIconId())
                .nameHe(p.getNameHe())
                .defaultUnit(p.getDefaultUnit())
                .imageUrl(p.getImageUrl())
                .addCount(addCount)
                .build();
    }
}
