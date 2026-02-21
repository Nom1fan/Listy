package com.listyyy.backend.list;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.exception.AccessDeniedException;
import com.listyyy.backend.exception.ResourceNotFoundException;
import com.listyyy.backend.exception.VersionCheck;
import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.CategoryRepository;
import com.listyyy.backend.websocket.WorkspaceEvent;
import com.listyyy.backend.websocket.WorkspaceEventPublisher;
import com.listyyy.backend.workspace.Workspace;
import com.listyyy.backend.workspace.WorkspaceAccessService;
import com.listyyy.backend.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroceryListService {

    private final GroceryListRepository listRepository;
    private final ListItemRepository listItemRepository;
    private final ListAccessService listAccessService;
    private final CategoryRepository categoryRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAccessService workspaceAccessService;
    private final WorkspaceEventPublisher workspaceEventPublisher;

    public List<GroceryList> listsForUser(User user) {
        return listRepository.findVisibleToUser(user.getId());
    }

    /** Lists for a specific workspace. */
    public List<GroceryList> listsForWorkspace(UUID workspaceId, User user) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        return listRepository.findByWorkspaceIdOrderBySortOrder(workspaceId);
    }

    @Transactional
    public GroceryList create(User user, UUID workspaceId, String name, String iconId, String imageUrl,
                              String categoryFilterModeStr, List<UUID> categoryIds) {
        Workspace workspace = workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        String listName = name != null && !name.isBlank() ? name : "רשימה חדשה";
        if (listRepository.existsByWorkspaceIdAndName(workspaceId, listName)) {
            throw new IllegalArgumentException("כבר קיימת רשימה בשם זה במרחב");
        }
        CategoryFilterMode filterMode = parseCategoryFilterMode(categoryFilterModeStr);
        Set<Category> filterCategories = resolveFilterCategories(filterMode, categoryIds, workspaceId);
        GroceryList list = GroceryList.builder()
                .name(listName)
                .workspace(workspace)
                .iconId(iconId)
                .imageUrl(imageUrl)
                .categoryFilterMode(filterMode)
                .filterCategories(filterCategories)
                .build();
        list = listRepository.save(list);
        workspaceEventPublisher.publish(workspaceId, WorkspaceEvent.EntityType.LIST,
                WorkspaceEvent.Action.CREATED, list.getId(), list.getName(), user);
        return list;
    }

    public GroceryList get(UUID listId, User user) {
        GroceryList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("הרשימה לא נמצאה"));
        if (!listAccessService.canAccess(user, listId)) {
            throw new AccessDeniedException("אין גישה");
        }
        return list;
    }

    @Transactional
    public GroceryList update(UUID listId, User user, String name, String iconId, String imageUrl, Long clientVersion,
                              String categoryFilterModeStr, List<UUID> categoryIds) {
        GroceryList list = get(listId, user);
        if (!listAccessService.canEdit(user, listId)) throw new AccessDeniedException("אין הרשאה לערוך");
        VersionCheck.check(clientVersion, list.getVersion());
        if (name != null && !name.isBlank()) {
            if (!name.equals(list.getName()) && listRepository.existsByWorkspaceIdAndNameAndIdNot(list.getWorkspace().getId(), name, list.getId())) {
                throw new IllegalArgumentException("כבר קיימת רשימה בשם זה במרחב");
            }
            list.setName(name);
        }
        if (iconId != null) list.setIconId(iconId.isBlank() ? null : iconId);
        if (imageUrl != null) list.setImageUrl(imageUrl.isBlank() ? null : imageUrl);
        if (categoryFilterModeStr != null) {
            CategoryFilterMode filterMode = parseCategoryFilterMode(categoryFilterModeStr);
            list.setCategoryFilterMode(filterMode);
            list.setFilterCategories(resolveFilterCategories(filterMode, categoryIds, list.getWorkspace().getId()));
        }
        list = listRepository.save(list);
        workspaceEventPublisher.publish(list.getWorkspace().getId(), WorkspaceEvent.EntityType.LIST,
                WorkspaceEvent.Action.UPDATED, list.getId(), list.getName(), user);
        return list;
    }

    @Transactional
    public void reorder(User user, List<UUID> listIds) {
        for (int i = 0; i < listIds.size(); i++) {
            GroceryList list = listRepository.findById(listIds.get(i))
                    .orElseThrow(() -> new ResourceNotFoundException("הרשימה לא נמצאה"));
            if (!listAccessService.canAccess(user, list.getId())) {
                throw new AccessDeniedException("אין גישה");
            }
            if (list.getSortOrder() != i) {
                list.setSortOrder(i);
                listRepository.save(list);
            }
        }
    }

    @Transactional
    public void delete(UUID listId, User user) {
        GroceryList list = get(listId, user);
        if (!listAccessService.isWorkspaceOwner(user, listId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול למחוק רשימות");
        }
        UUID wsId = list.getWorkspace().getId();
        String name = list.getName();
        // Delete children first to stay portable across DBs (H2 tests don't have ON DELETE CASCADE).
        listItemRepository.deleteByListId(listId);
        listRepository.removeFilterCategoryEntriesByListId(listId);
        listRepository.delete(list);
        workspaceEventPublisher.publish(wsId, WorkspaceEvent.EntityType.LIST,
                WorkspaceEvent.Action.DELETED, listId, name, user);
    }

    private CategoryFilterMode parseCategoryFilterMode(String mode) {
        if (mode == null || mode.isBlank()) return CategoryFilterMode.NONE;
        try {
            return CategoryFilterMode.valueOf(mode.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("מצב סינון קטגוריות לא חוקי: " + mode);
        }
    }

    private Set<Category> resolveFilterCategories(CategoryFilterMode mode, List<UUID> categoryIds, UUID workspaceId) {
        if (mode == CategoryFilterMode.NONE || categoryIds == null || categoryIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        for (Category cat : categories) {
            if (!cat.getWorkspace().getId().equals(workspaceId)) {
                throw new IllegalArgumentException("הקטגוריה " + cat.getNameHe() + " לא שייכת למרחב הזה");
            }
        }
        return new HashSet<>(categories);
    }
}
