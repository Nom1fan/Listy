package com.example.demo.productbank;

import com.example.demo.auth.User;
import com.example.demo.auth.UserRepository;
import com.example.demo.sharing.InviteRequest;
import com.example.demo.sharing.ListMemberDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategorySharingServiceTest {

    @Mock
    private CategoryMemberRepository categoryMemberRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryAccessService categoryAccessService;

    @InjectMocks
    private CategorySharingService categorySharingService;

    private User owner;
    private User invitee;
    private UUID categoryId1;
    private UUID categoryId2;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(UUID.randomUUID())
                .email("owner@example.com")
                .displayName("Owner")
                .locale("he")
                .build();
        invitee = User.builder()
                .id(UUID.randomUUID())
                .email("other@example.com")
                .displayName("Other")
                .locale("he")
                .build();
        categoryId1 = UUID.randomUUID();
        categoryId2 = UUID.randomUUID();
    }

    @Test
    void inviteToAllMyCategories_adds_invitee_to_all_owned_categories() {
        InviteRequest req = new InviteRequest();
        req.setEmail("other@example.com");
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(invitee));

        Category cat1 = Category.builder().id(categoryId1).owner(owner).nameHe("א").iconId("x").sortOrder(0).build();
        Category cat2 = Category.builder().id(categoryId2).owner(owner).nameHe("ב").iconId("y").sortOrder(1).build();
        when(categoryRepository.findByOwnerIdOrderBySortOrderAsc(owner.getId())).thenReturn(List.of(cat1, cat2));
        when(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId1, invitee.getId())).thenReturn(false);
        when(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId2, invitee.getId())).thenReturn(false);

        ShareAllCategoriesResult result = categorySharingService.inviteToAllMyCategories(owner, req);

        assertThat(result.getMember().getUserId()).isEqualTo(invitee.getId());
        assertThat(result.getMember().getRole()).isEqualTo("editor");
        assertThat(result.getCategoriesAdded()).isEqualTo(2);
        assertThat(result.getTotalCategories()).isEqualTo(2);

        ArgumentCaptor<CategoryMember> captor = ArgumentCaptor.forClass(CategoryMember.class);
        verify(categoryMemberRepository, org.mockito.Mockito.times(2)).save(captor.capture());
        List<CategoryMember> saved = captor.getAllValues();
        assertThat(saved).extracting(CategoryMember::getCategoryId).containsExactlyInAnyOrder(categoryId1, categoryId2);
        assertThat(saved).allMatch(m -> m.getUserId().equals(invitee.getId()) && "editor".equals(m.getRole()));
    }

    @Test
    void inviteToAllMyCategories_skips_categories_invitee_already_member_of() {
        InviteRequest req = new InviteRequest();
        req.setEmail("other@example.com");
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(invitee));

        Category cat1 = Category.builder().id(categoryId1).owner(owner).nameHe("א").iconId("x").sortOrder(0).build();
        Category cat2 = Category.builder().id(categoryId2).owner(owner).nameHe("ב").iconId("y").sortOrder(1).build();
        when(categoryRepository.findByOwnerIdOrderBySortOrderAsc(owner.getId())).thenReturn(List.of(cat1, cat2));
        when(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId1, invitee.getId())).thenReturn(true);
        when(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId2, invitee.getId())).thenReturn(false);

        ShareAllCategoriesResult result = categorySharingService.inviteToAllMyCategories(owner, req);

        assertThat(result.getCategoriesAdded()).isEqualTo(1);
        assertThat(result.getTotalCategories()).isEqualTo(2);
        verify(categoryMemberRepository).save(any());
    }

    @Test
    void inviteToAllMyCategories_throws_when_inviting_self() {
        InviteRequest req = new InviteRequest();
        req.setEmail("owner@example.com");
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> categorySharingService.inviteToAllMyCategories(owner, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("לא ניתן להזמין את עצמך");
        verify(categoryMemberRepository, never()).save(any());
    }

    @Test
    void inviteToAllMyCategories_resolves_invitee_by_phone() {
        InviteRequest req = new InviteRequest();
        req.setPhone("050-1234567");
        when(userRepository.findByPhone("+972501234567")).thenReturn(Optional.of(invitee));

        Category cat = Category.builder().id(categoryId1).owner(owner).nameHe("א").iconId("x").sortOrder(0).build();
        when(categoryRepository.findByOwnerIdOrderBySortOrderAsc(owner.getId())).thenReturn(List.of(cat));
        when(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId1, invitee.getId())).thenReturn(false);

        ShareAllCategoriesResult result = categorySharingService.inviteToAllMyCategories(owner, req);

        assertThat(result.getMember().getUserId()).isEqualTo(invitee.getId());
        assertThat(result.getCategoriesAdded()).isEqualTo(1);
        verify(userRepository).findByPhone("+972501234567");
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void inviteToAllMyCategories_throws_when_no_email_or_phone() {
        InviteRequest req = new InviteRequest();

        assertThatThrownBy(() -> categorySharingService.inviteToAllMyCategories(owner, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("יש להזין אימייל או טלפון");
        verify(categoryMemberRepository, never()).save(any());
    }

    @Test
    void inviteToAllMyCategories_throws_when_user_not_found_by_email() {
        InviteRequest req = new InviteRequest();
        req.setEmail("unknown@example.com");
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categorySharingService.inviteToAllMyCategories(owner, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("לא נמצא משתמש עם אימייל זה");
        verify(categoryMemberRepository, never()).save(any());
    }

    @Test
    void inviteToAllMyCategories_returns_zero_added_when_no_owned_categories() {
        InviteRequest req = new InviteRequest();
        req.setEmail("other@example.com");
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(invitee));
        when(categoryRepository.findByOwnerIdOrderBySortOrderAsc(owner.getId())).thenReturn(List.of());

        ShareAllCategoriesResult result = categorySharingService.inviteToAllMyCategories(owner, req);

        assertThat(result.getMember().getUserId()).isEqualTo(invitee.getId());
        assertThat(result.getCategoriesAdded()).isEqualTo(0);
        assertThat(result.getTotalCategories()).isEqualTo(0);
        verify(categoryMemberRepository, never()).save(any());
    }
}
