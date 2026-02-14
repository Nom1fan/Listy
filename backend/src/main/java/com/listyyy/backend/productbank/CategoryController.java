package com.listyyy.backend.productbank;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.exception.AccessDeniedException;
import com.listyyy.backend.list.ListItemRepository;
import com.listyyy.backend.workspace.Workspace;
import com.listyyy.backend.workspace.WorkspaceAccessService;
import com.listyyy.backend.workspace.WorkspaceRepository;
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
    private final CategoryAccessService categoryAccessService;
    private final ListItemRepository listItemRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAccessService workspaceAccessService;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> list(
            @RequestParam(required = false) UUID workspaceId,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        List<Category> categories;
        if (workspaceId != null) {
            workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
            categories = categoryRepository.findByWorkspaceId(workspaceId);
        } else {
            categories = categoryRepository.findVisibleToUser(user.getId());
        }
        Map<UUID, Long> addCountByCategory = getCategoryAddCounts();
        List<CategoryDto> body = categories.stream()
                .map(c -> toDto(c, addCountByCategory.getOrDefault(c.getId(), 0L)))
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
        return ResponseEntity.ok(toDto(c, addCountByCategory.getOrDefault(c.getId(), 0L)));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<CategoryDto> create(
            @Valid @RequestBody CreateCategoryRequest req,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        UUID wsId = req.getWorkspaceId();
        if (wsId == null) throw new IllegalArgumentException("חובה לציין מרחב");
        Workspace workspace = workspaceAccessService.getWorkspaceOrThrow(wsId, user);
        String trimmedName = req.getNameHe().trim();
        if (categoryRepository.existsByWorkspaceIdAndNameHe(wsId, trimmedName)) {
            throw new IllegalArgumentException("כבר קיימת קטגוריה בשם זה במרחב");
        }
        int sortOrder = req.getSortOrder() != null ? req.getSortOrder() : 0;
        Category c = Category.builder()
                .workspace(workspace)
                .nameHe(trimmedName)
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
        Category c = categoryAccessService.getCategoryOrThrow(id, user);
        if (!categoryAccessService.canEdit(user, id)) throw new AccessDeniedException("אין גישה");
        if (req.getNameHe() != null && !req.getNameHe().isBlank()) {
            String trimmedName = req.getNameHe().trim();
            if (!trimmedName.equals(c.getNameHe()) && categoryRepository.existsByWorkspaceIdAndNameHeAndIdNot(c.getWorkspace().getId(), trimmedName, c.getId())) {
                throw new IllegalArgumentException("כבר קיימת קטגוריה בשם זה במרחב");
            }
            c.setNameHe(trimmedName);
        }
        if (req.getIconId() != null) c.setIconId(req.getIconId().isBlank() ? null : req.getIconId());
        if (req.getImageUrl() != null) c.setImageUrl(req.getImageUrl().isBlank() ? null : req.getImageUrl());
        if (req.getSortOrder() != null) c.setSortOrder(req.getSortOrder());
        c = categoryRepository.save(c);
        return ResponseEntity.ok(toDto(c, getCategoryAddCounts().getOrDefault(c.getId(), 0L)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        Category c = categoryAccessService.getCategoryOrThrow(id, user);
        if (!categoryAccessService.isWorkspaceOwner(user, id)) {
            throw new AccessDeniedException("רק בעל המרחב יכול למחוק קטגוריה");
        }
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

    private static CategoryDto toDto(Category c, long addCount) {
        return CategoryDto.builder()
                .id(c.getId())
                .workspaceId(c.getWorkspace() != null ? c.getWorkspace().getId() : null)
                .nameHe(c.getNameHe())
                .iconId(c.getIconId())
                .imageUrl(c.getImageUrl())
                .sortOrder(c.getSortOrder())
                .addCount(addCount)
                .build();
    }
}
