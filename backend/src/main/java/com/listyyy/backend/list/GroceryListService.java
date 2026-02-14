package com.listyyy.backend.list;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.workspace.Workspace;
import com.listyyy.backend.workspace.WorkspaceAccessService;
import com.listyyy.backend.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroceryListService {

    private final GroceryListRepository listRepository;
    private final ListItemRepository listItemRepository;
    private final ListAccessService listAccessService;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAccessService workspaceAccessService;

    public List<GroceryList> listsForUser(User user) {
        return listRepository.findVisibleToUser(user.getId());
    }

    /** Lists for a specific workspace. */
    public List<GroceryList> listsForWorkspace(UUID workspaceId, User user) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        return listRepository.findByWorkspaceIdOrderBySortOrder(workspaceId);
    }

    @Transactional
    public GroceryList create(User user, UUID workspaceId, String name, String iconId, String imageUrl) {
        Workspace workspace = workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        GroceryList list = GroceryList.builder()
                .name(name != null && !name.isBlank() ? name : "רשימה חדשה")
                .workspace(workspace)
                .iconId(iconId)
                .imageUrl(imageUrl)
                .build();
        return listRepository.save(list);
    }

    public GroceryList get(UUID listId, User user) {
        GroceryList list = listRepository.findById(listId)
                .orElseThrow(() -> new IllegalArgumentException("הרשימה לא נמצאה"));
        if (!listAccessService.canAccess(user, listId)) {
            throw new IllegalArgumentException("אין גישה");
        }
        return list;
    }

    @Transactional
    public GroceryList update(UUID listId, User user, String name, String iconId, String imageUrl) {
        GroceryList list = get(listId, user);
        if (!listAccessService.canEdit(user, listId)) throw new IllegalArgumentException("אין הרשאה לערוך");
        if (name != null && !name.isBlank()) list.setName(name);
        if (iconId != null) list.setIconId(iconId.isBlank() ? null : iconId);
        if (imageUrl != null) list.setImageUrl(imageUrl.isBlank() ? null : imageUrl);
        return listRepository.save(list);
    }

    @Transactional
    public void reorder(User user, List<UUID> listIds) {
        for (int i = 0; i < listIds.size(); i++) {
            GroceryList list = listRepository.findById(listIds.get(i))
                    .orElseThrow(() -> new IllegalArgumentException("הרשימה לא נמצאה"));
            if (!listAccessService.canAccess(user, list.getId())) {
                throw new IllegalArgumentException("אין גישה");
            }
            list.setSortOrder(i);
            listRepository.save(list);
        }
    }

    @Transactional
    public void delete(UUID listId, User user) {
        GroceryList list = get(listId, user);
        if (!listAccessService.isWorkspaceOwner(user, listId)) {
            throw new IllegalArgumentException("רק בעל המרחב יכול למחוק רשימות");
        }
        // Delete children first to stay portable across DBs (H2 tests don't have ON DELETE CASCADE).
        listItemRepository.deleteByListId(listId);
        listRepository.delete(list);
    }
}
