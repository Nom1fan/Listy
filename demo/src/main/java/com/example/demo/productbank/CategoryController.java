package com.example.demo.productbank;

import com.example.demo.auth.User;
import com.example.demo.list.ListItemRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final ListItemRepository listItemRepository;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> list() {
        List<Category> categories = categoryRepository.findAllByOrderBySortOrderAsc();
        Map<UUID, Long> addCountByCategory = getCategoryAddCounts();
        List<CategoryDto> body = categories.stream()
                .map(c -> toDto(c, addCountByCategory.getOrDefault(c.getId(), 0L)))
                .sorted((a, b) -> {
                    int c = Long.compare(b.getAddCount(), a.getAddCount());
                    return c != 0 ? c : Integer.compare(a.getSortOrder(), b.getSortOrder());
                })
                .toList();
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto> get(@PathVariable UUID id) {
        Map<UUID, Long> addCountByCategory = getCategoryAddCounts();
        return categoryRepository.findById(id)
                .map(c -> toDto(c, addCountByCategory.getOrDefault(c.getId(), 0L)))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CategoryDto> create(
            @Valid @RequestBody CreateCategoryRequest req,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        int sortOrder = req.getSortOrder() != null ? req.getSortOrder() : 0;
        Category c = Category.builder()
                .nameHe(req.getNameHe().trim())
                .iconId(req.getIconId())
                .imageUrl(req.getImageUrl())
                .sortOrder(sortOrder)
                .build();
        c = categoryRepository.save(c);
        return ResponseEntity.ok(toDto(c, 0L));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CategoryDto> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody UpdateCategoryRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        Category c = categoryRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Category not found"));
        if (req.getNameHe() != null && !req.getNameHe().isBlank()) c.setNameHe(req.getNameHe().trim());
        if (req.getIconId() != null) c.setIconId(req.getIconId());
        if (req.getImageUrl() != null) c.setImageUrl(req.getImageUrl());
        if (req.getSortOrder() != null) c.setSortOrder(req.getSortOrder());
        c = categoryRepository.save(c);
        return ResponseEntity.ok(toDto(c, getCategoryAddCounts().getOrDefault(c.getId(), 0L)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        if (!categoryRepository.existsById(id)) return ResponseEntity.notFound().build();
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Map<UUID, Long> getCategoryAddCounts() {
        return listItemRepository.countByCategoryId().stream()
                .collect(Collectors.toMap(
                        row -> toUuid(row[0]),
                        row -> ((Number) row[1]).longValue()
                ));
    }

    private static UUID toUuid(Object o) {
        if (o instanceof UUID) return (UUID) o;
        return UUID.fromString(o.toString());
    }

    private static CategoryDto toDto(Category c, long addCount) {
        return CategoryDto.builder()
                .id(c.getId())
                .nameHe(c.getNameHe())
                .iconId(c.getIconId())
                .imageUrl(c.getImageUrl())
                .sortOrder(c.getSortOrder())
                .addCount(addCount)
                .build();
    }
}
