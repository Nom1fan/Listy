package com.example.demo.productbank;

import com.example.demo.auth.User;
import com.example.demo.list.ListItemRepository;
import com.example.demo.sharing.InviteRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
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
    private final CategoryMemberRepository categoryMemberRepository;
    private final CategoryAccessService categoryAccessService;
    private final CategorySharingService categorySharingService;
    private final ListItemRepository listItemRepository;

    @PostMapping("/share-all")
    public ResponseEntity<ShareAllCategoriesResult> shareAll(
            @RequestBody InviteRequest req,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(categorySharingService.inviteToAllMyCategories(user, req));
    }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> list(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        List<Category> categories = categoryRepository.findVisibleToUser(user.getId());
        Map<UUID, Long> addCountByCategory = getCategoryAddCounts();
        Map<UUID, Integer> memberCounts = getMemberCounts();
        List<CategoryDto> body = categories.stream()
                .map(c -> toDto(c, addCountByCategory.getOrDefault(c.getId(), 0L), memberCounts.getOrDefault(c.getId(), 1)))
                .sorted((a, b) -> {
                    int cmp = Long.compare(b.getAddCount(), a.getAddCount());
                    return cmp != 0 ? cmp : Integer.compare(a.getSortOrder(), b.getSortOrder());
                })
                .toList();
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto> get(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        if (categoryRepository.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        Category c = categoryAccessService.getCategoryOrThrow(id, user);
        Map<UUID, Long> addCountByCategory = getCategoryAddCounts();
        int memberCount = categoryMemberRepository.findByCategoryId(id).size();
        return ResponseEntity.ok(toDto(c, addCountByCategory.getOrDefault(c.getId(), 0L), memberCount));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<CategoryDto> create(
            @Valid @RequestBody CreateCategoryRequest req,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        int sortOrder = req.getSortOrder() != null ? req.getSortOrder() : 0;
        Category c = Category.builder()
                .owner(user)
                .nameHe(req.getNameHe().trim())
                .iconId(req.getIconId())
                .imageUrl(req.getImageUrl())
                .sortOrder(sortOrder)
                .build();
        c = categoryRepository.save(c);
        CategoryMember member = CategoryMember.builder()
                .categoryId(c.getId())
                .userId(user.getId())
                .category(c)
                .user(user)
                .role("owner")
                .build();
        categoryMemberRepository.save(member);
        return ResponseEntity.ok(toDto(c, 0L, 1));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CategoryDto> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody UpdateCategoryRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        Category c = categoryAccessService.getCategoryOrThrow(id, user);
        if (!categoryAccessService.canEdit(user, id)) throw new IllegalArgumentException("Access denied");
        if (req.getNameHe() != null && !req.getNameHe().isBlank()) c.setNameHe(req.getNameHe().trim());
        if (req.getIconId() != null) c.setIconId(req.getIconId());
        if (req.getImageUrl() != null) c.setImageUrl(req.getImageUrl());
        if (req.getSortOrder() != null) c.setSortOrder(req.getSortOrder());
        c = categoryRepository.save(c);
        int memberCount = categoryMemberRepository.findByCategoryId(id).size();
        return ResponseEntity.ok(toDto(c, getCategoryAddCounts().getOrDefault(c.getId(), 0L), memberCount));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        Category c = categoryAccessService.getCategoryOrThrow(id, user);
        if (!categoryAccessService.isOwner(user, id)) throw new IllegalArgumentException("Only owner can delete category");
        categoryMemberRepository.deleteByCategoryId(id);
        categoryRepository.delete(c);
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

    private Map<UUID, Integer> getMemberCounts() {
        return categoryMemberRepository.countMembersByCategory().stream()
                .collect(Collectors.toMap(
                        row -> toUuid(row[0]),
                        row -> ((Number) row[1]).intValue()
                ));
    }

    private static CategoryDto toDto(Category c, long addCount, int memberCount) {
        return CategoryDto.builder()
                .id(c.getId())
                .ownerId(c.getOwner() != null ? c.getOwner().getId() : null)
                .nameHe(c.getNameHe())
                .iconId(c.getIconId())
                .imageUrl(c.getImageUrl())
                .sortOrder(c.getSortOrder())
                .addCount(addCount)
                .memberCount(memberCount)
                .build();
    }
}
