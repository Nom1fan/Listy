package com.listyyy.backend.list;

import com.listyyy.backend.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class GroceryListService {

    private final GroceryListRepository listRepository;
    private final ListMemberRepository listMemberRepository;
    private final ListItemRepository listItemRepository;
    private final ListAccessService listAccessService;

    public List<GroceryList> listsForUser(User user) {
        List<GroceryList> owned = listRepository.findByOwnerIdOrderBySortOrder(user.getId());
        List<ListMember> memberships = listMemberRepository.findByUserId(user.getId());
        List<GroceryList> shared = memberships.stream()
                .map(ListMember::getList)
                .filter(l -> !l.getOwner().getId().equals(user.getId()))
                .toList();
        return Stream.concat(owned.stream(), shared.stream()).toList();
    }

    @Transactional
    public GroceryList create(User user, String name, String iconId, String imageUrl) {
        GroceryList list = GroceryList.builder()
                .name(name != null && !name.isBlank() ? name : "רשימה חדשה")
                .owner(user)
                .iconId(iconId)
                .imageUrl(imageUrl)
                .build();
        list = listRepository.save(list);
        ListMember member = new ListMember();
        member.setListId(list.getId());
        member.setUserId(user.getId());
        member.setList(list);
        member.setUser(user);
        member.setRole("owner");
        listMemberRepository.save(member);
        return list;
    }

    public GroceryList get(UUID listId, User user) {
        GroceryList list = listRepository.findById(listId).orElseThrow(() -> new IllegalArgumentException("הרשימה לא נמצאה"));
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
        if (!list.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("רק בעל הרשימה יכול למחוק");
        }
        // Delete children first to stay portable across DBs (H2 tests don't have ON DELETE CASCADE).
        listItemRepository.deleteByListId(listId);
        listMemberRepository.deleteByListId(listId);
        listRepository.delete(list);
    }
}
