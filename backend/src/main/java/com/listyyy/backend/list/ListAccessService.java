package com.listyyy.backend.list;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.exception.AccessDeniedException;
import com.listyyy.backend.exception.ResourceNotFoundException;
import com.listyyy.backend.workspace.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListAccessService {

    private final GroceryListRepository listRepository;
    private final WorkspaceAccessService workspaceAccessService;

    public boolean canAccess(User user, UUID listId) {
        if (user == null) return false;
        return listRepository.findById(listId)
                .map(l -> workspaceAccessService.canAccess(user, l.getWorkspace().getId()))
                .orElse(false);
    }

    public boolean canEdit(User user, UUID listId) {
        return canAccess(user, listId);
    }

    public boolean isWorkspaceOwner(User user, UUID listId) {
        if (user == null) return false;
        return listRepository.findById(listId)
                .map(l -> workspaceAccessService.isOwner(user, l.getWorkspace().getId()))
                .orElse(false);
    }

    public GroceryList getListOrThrow(UUID listId, User user) {
        GroceryList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("הרשימה לא נמצאה"));
        if (!canAccess(user, listId)) throw new AccessDeniedException("אין גישה");
        return list;
    }
}
