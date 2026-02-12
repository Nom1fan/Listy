package com.example.demo.list;

import com.example.demo.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListAccessService {

    private final GroceryListRepository listRepository;
    private final ListMemberRepository listMemberRepository;

    public boolean canAccess(User user, UUID listId) {
        if (user == null) return false;
        return listMemberRepository.existsByListIdAndUserId(listId, user.getId());
    }

    public boolean canEdit(User user, UUID listId) {
        return canAccess(user, listId);
    }

    public GroceryList getListOrThrow(UUID listId, User user) {
        GroceryList list = listRepository.findById(listId).orElseThrow(() -> new IllegalArgumentException("List not found"));
        if (!canAccess(user, listId)) throw new IllegalArgumentException("Access denied");
        return list;
    }
}
