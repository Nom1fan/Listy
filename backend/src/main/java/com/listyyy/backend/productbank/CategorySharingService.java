package com.listyyy.backend.productbank;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.sharing.ListMemberDto;
import com.listyyy.backend.sharing.InviteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategorySharingService {

    private final CategoryMemberRepository categoryMemberRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CategoryAccessService categoryAccessService;

    public List<ListMemberDto> getMembers(UUID categoryId, User user) {
        Category category = categoryAccessService.getCategoryOrThrow(categoryId, user);
        return categoryMemberRepository.findByCategoryId(categoryId).stream()
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
    public ListMemberDto invite(UUID categoryId, User user, InviteRequest req) {
        Category category = categoryAccessService.getCategoryOrThrow(categoryId, user);
        if (!categoryAccessService.isOwner(user, categoryId)) {
            throw new IllegalArgumentException("רק בעל הקטגוריה יכול להזמין");
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
        if (categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, invitee.getId())) {
            throw new IllegalArgumentException("המשתמש כבר חבר בקטגוריה");
        }
        CategoryMember member = CategoryMember.builder()
                .categoryId(categoryId)
                .userId(invitee.getId())
                .category(category)
                .user(invitee)
                .role("editor")
                .build();
        categoryMemberRepository.save(member);
        return ListMemberDto.builder()
                .userId(invitee.getId())
                .displayName(invitee.getDisplayName())
                .email(invitee.getEmail())
                .phone(invitee.getPhone())
                .role("editor")
                .build();
    }

    @Transactional
    public void removeMember(UUID categoryId, UUID memberUserId, User user) {
        Category category = categoryAccessService.getCategoryOrThrow(categoryId, user);
        if (category.getOwner().getId().equals(memberUserId)) {
            throw new IllegalArgumentException("לא ניתן להסיר את בעל הקטגוריה");
        }
        if (!categoryAccessService.isOwner(user, categoryId) && !user.getId().equals(memberUserId)) {
            throw new IllegalArgumentException("רק בעל הקטגוריה יכול להסיר אחרים");
        }
        categoryMemberRepository.findByCategoryIdAndUserId(categoryId, memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("החבר לא נמצא"));
        categoryMemberRepository.deleteById(new CategoryMemberId(categoryId, memberUserId));
    }

    /**
     * Invite a user to all categories owned by the current user (share all categories).
     * Skips categories the user is already a member of.
     */
    @Transactional
    public ShareAllCategoriesResult inviteToAllMyCategories(User user, InviteRequest req) {
        User invitee = resolveInvitee(req);
        if (invitee.getId().equals(user.getId())) throw new IllegalArgumentException("לא ניתן להזמין את עצמך");
        List<Category> myCategories = categoryRepository.findByOwnerIdOrderBySortOrderAsc(user.getId());
        int added = 0;
        for (Category category : myCategories) {
            if (categoryMemberRepository.existsByCategoryIdAndUserId(category.getId(), invitee.getId())) continue;
            CategoryMember member = CategoryMember.builder()
                    .categoryId(category.getId())
                    .userId(invitee.getId())
                    .category(category)
                    .user(invitee)
                    .role("editor")
                    .build();
            categoryMemberRepository.save(member);
            added++;
        }
        return new ShareAllCategoriesResult(
                ListMemberDto.builder()
                        .userId(invitee.getId())
                        .displayName(invitee.getDisplayName())
                        .email(invitee.getEmail())
                        .phone(invitee.getPhone())
                        .role("editor")
                        .build(),
                added,
                myCategories.size()
        );
    }

    private User resolveInvitee(InviteRequest req) {
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            return userRepository.findByEmail(req.getEmail().trim())
                    .orElseThrow(() -> new IllegalArgumentException("לא נמצא משתמש עם אימייל זה"));
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            String normalized = com.listyyy.backend.auth.PhoneNormalizer.normalize(req.getPhone());
            return userRepository.findByPhone(normalized)
                    .orElseThrow(() -> new IllegalArgumentException("לא נמצא משתמש עם מספר טלפון זה"));
        }
        throw new IllegalArgumentException("יש להזין אימייל או טלפון");
    }
}
