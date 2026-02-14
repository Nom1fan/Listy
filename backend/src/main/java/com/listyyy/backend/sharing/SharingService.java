package com.listyyy.backend.sharing;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.list.GroceryList;
import com.listyyy.backend.list.ListItemRepository;
import com.listyyy.backend.list.ListMember;
import com.listyyy.backend.list.ListMemberRepository;
import com.listyyy.backend.list.ListAccessService;
import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.CategoryMember;
import com.listyyy.backend.productbank.CategoryMemberRepository;
import com.listyyy.backend.productbank.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SharingService {

    private final ListMemberRepository listMemberRepository;
    private final UserRepository userRepository;
    private final ListAccessService listAccessService;
    private final ListItemRepository listItemRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryMemberRepository categoryMemberRepository;

    public List<ListMemberDto> getMembers(UUID listId, User user) {
        GroceryList list = listAccessService.getListOrThrow(listId, user);
        return listMemberRepository.findByListId(listId).stream()
                .map(m -> ListMemberDto.builder()
                        .userId(m.getUserId())
                        .displayName(m.getUser().getDisplayName())
                        .email(m.getUser().getEmail())
                        .phone(m.getUser().getPhone())
                        .role(m.getRole())
                        .build())
                .toList();
    }

    @Transactional
    public ListMemberDto invite(UUID listId, User user, InviteRequest req) {
        GroceryList list = listAccessService.getListOrThrow(listId, user);
        if (!list.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("רק בעל הרשימה יכול להזמין");
        }
        User invitee = null;
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            invitee = userRepository.findByEmail(req.getEmail().trim()).orElseThrow(() -> new IllegalArgumentException("לא נמצא משתמש עם אימייל זה"));
        } else if (req.getPhone() != null && !req.getPhone().isBlank()) {
            String normalized = com.listyyy.backend.auth.PhoneNormalizer.normalize(req.getPhone());
            invitee = userRepository.findByPhone(normalized).orElseThrow(() -> new IllegalArgumentException("לא נמצא משתמש עם מספר טלפון זה"));
        }
        if (invitee == null) throw new IllegalArgumentException("יש להזין אימייל או טלפון");
        if (invitee.getId().equals(user.getId())) throw new IllegalArgumentException("לא ניתן להזמין את עצמך");
        if (listMemberRepository.existsByListIdAndUserId(listId, invitee.getId())) {
            throw new IllegalArgumentException("המשתמש כבר חבר ברשימה");
        }
        ListMember member = new ListMember();
        member.setListId(listId);
        member.setUserId(invitee.getId());
        member.setList(list);
        member.setUser(invitee);
        member.setRole("editor");
        listMemberRepository.save(member);

        // Auto-share categories: any category used by products on this list (that the list owner owns)
        // is shared with the new list member so the product bank stays in sync.
        shareCategoriesUsedByListWithUser(listId, user.getId(), invitee);

        return ListMemberDto.builder()
                .userId(invitee.getId())
                .displayName(invitee.getDisplayName())
                .email(invitee.getEmail())
                .phone(invitee.getPhone())
                .role("editor")
                .build();
    }

    /**
     * For each category used by products on this list that the listOwnerId owns (and is not system),
     * add the user as an editor so they can see products in that category.
     */
    private void shareCategoriesUsedByListWithUser(UUID listId, UUID listOwnerId, User userToAdd) {
        List<UUID> categoryIds = listItemRepository.findDistinctCategoryIdsByListId(listId);
        for (UUID categoryId : categoryIds) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            if (category == null) continue;
            if (!category.getOwner().getId().equals(listOwnerId)) continue; // only share categories we own
            if (categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, userToAdd.getId())) continue;
            CategoryMember member = CategoryMember.builder()
                    .categoryId(categoryId)
                    .userId(userToAdd.getId())
                    .category(category)
                    .user(userToAdd)
                    .role("editor")
                    .build();
            categoryMemberRepository.save(member);
        }
    }

    @Transactional
    public void removeMember(UUID listId, UUID memberUserId, User user) {
        GroceryList list = listAccessService.getListOrThrow(listId, user);
        if (list.getOwner().getId().equals(memberUserId)) {
            throw new IllegalArgumentException("לא ניתן להסיר את בעל הרשימה");
        }
        if (!list.getOwner().getId().equals(user.getId()) && !user.getId().equals(memberUserId)) {
            throw new IllegalArgumentException("רק בעל הרשימה יכול להסיר אחרים");
        }
        listMemberRepository.findByListIdAndUserId(listId, memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("החבר לא נמצא"));
        listMemberRepository.deleteById(new com.listyyy.backend.list.ListMemberId(listId, memberUserId));
    }
}