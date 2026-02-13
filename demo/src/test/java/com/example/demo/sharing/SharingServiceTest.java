package com.example.demo.sharing;

import com.example.demo.auth.User;
import com.example.demo.auth.UserRepository;
import com.example.demo.list.GroceryList;
import com.example.demo.list.ListAccessService;
import com.example.demo.list.ListItemRepository;
import com.example.demo.list.ListMemberRepository;
import com.example.demo.productbank.Category;
import com.example.demo.productbank.CategoryMemberRepository;
import com.example.demo.productbank.CategoryRepository;
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
class SharingServiceTest {

    @Mock
    private ListMemberRepository listMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ListAccessService listAccessService;
    @Mock
    private ListItemRepository listItemRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private CategoryMemberRepository categoryMemberRepository;

    @InjectMocks
    private SharingService sharingService;

    private User owner;
    private User invitee;
    private UUID listId;
    private UUID categoryId;
    private GroceryList list;

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
        listId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        list = GroceryList.builder()
                .id(listId)
                .name("My List")
                .owner(owner)
                .build();
    }

    @Test
    void invite_adds_list_member_and_auto_shares_categories_used_by_list() {
        when(listAccessService.getListOrThrow(listId, owner)).thenReturn(list);
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(invitee));
        when(listMemberRepository.existsByListIdAndUserId(listId, invitee.getId())).thenReturn(false);
        when(listItemRepository.findDistinctCategoryIdsByListId(listId)).thenReturn(List.of(categoryId));
        Category category = Category.builder()
                .id(categoryId)
                .owner(owner)
                .nameHe("מכולת")
                .iconId("groceries")
                .sortOrder(0)
                .build();
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, invitee.getId())).thenReturn(false);

        InviteRequest req = new InviteRequest();
        req.setEmail("other@example.com");
        ListMemberDto result = sharingService.invite(listId, owner, req);

        assertThat(result.getUserId()).isEqualTo(invitee.getId());
        assertThat(result.getRole()).isEqualTo("editor");
        verify(listMemberRepository).save(any());

        ArgumentCaptor<com.example.demo.productbank.CategoryMember> memberCaptor =
                ArgumentCaptor.forClass(com.example.demo.productbank.CategoryMember.class);
        verify(categoryMemberRepository).save(memberCaptor.capture());
        assertThat(memberCaptor.getValue().getCategoryId()).isEqualTo(categoryId);
        assertThat(memberCaptor.getValue().getUserId()).isEqualTo(invitee.getId());
        assertThat(memberCaptor.getValue().getRole()).isEqualTo("editor");
    }

    @Test
    void invite_does_not_add_category_member_when_category_owned_by_other() {
        when(listAccessService.getListOrThrow(listId, owner)).thenReturn(list);
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(invitee));
        when(listMemberRepository.existsByListIdAndUserId(listId, invitee.getId())).thenReturn(false);
        when(listItemRepository.findDistinctCategoryIdsByListId(listId)).thenReturn(List.of(categoryId));
        User otherOwner = User.builder().id(UUID.randomUUID()).email("x@x.com").displayName("X").locale("he").build();
        Category category = Category.builder()
                .id(categoryId)
                .owner(otherOwner)
                .nameHe("מכולת")
                .iconId("groceries")
                .sortOrder(0)
                .build();
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

        InviteRequest req = new InviteRequest();
        req.setEmail("other@example.com");
        sharingService.invite(listId, owner, req);

        verify(listMemberRepository).save(any());
        verify(categoryMemberRepository, never()).save(any());
    }

    @Test
    void invite_skips_category_when_invitee_already_member() {
        when(listAccessService.getListOrThrow(listId, owner)).thenReturn(list);
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(invitee));
        when(listMemberRepository.existsByListIdAndUserId(listId, invitee.getId())).thenReturn(false);
        when(listItemRepository.findDistinctCategoryIdsByListId(listId)).thenReturn(List.of(categoryId));
        Category category = Category.builder()
                .id(categoryId)
                .owner(owner)
                .nameHe("מכולת")
                .iconId("groceries")
                .sortOrder(0)
                .build();
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, invitee.getId())).thenReturn(true);

        InviteRequest req = new InviteRequest();
        req.setEmail("other@example.com");
        sharingService.invite(listId, owner, req);

        verify(listMemberRepository).save(any());
        verify(categoryMemberRepository, never()).save(any());
    }

    @Test
    void invite_throws_when_not_owner() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("x@x.com").displayName("X").locale("he").build();
        when(listAccessService.getListOrThrow(listId, otherUser)).thenReturn(list);

        InviteRequest req = new InviteRequest();
        req.setEmail("other@example.com");
        assertThatThrownBy(() -> sharingService.invite(listId, otherUser, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("רק בעל הרשימה יכול להזמין");
        verify(listMemberRepository, never()).save(any());
    }

    @Test
    void invite_throws_when_cannot_invite_self() {
        when(listAccessService.getListOrThrow(listId, owner)).thenReturn(list);
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));

        InviteRequest req = new InviteRequest();
        req.setEmail("owner@example.com");
        assertThatThrownBy(() -> sharingService.invite(listId, owner, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("לא ניתן להזמין את עצמך");
        verify(listMemberRepository, never()).save(any());
    }

    @Test
    void invite_throws_when_user_not_found() {
        when(listAccessService.getListOrThrow(listId, owner)).thenReturn(list);
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        InviteRequest req = new InviteRequest();
        req.setEmail("unknown@example.com");
        assertThatThrownBy(() -> sharingService.invite(listId, owner, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("לא נמצא משתמש");
        verify(listMemberRepository, never()).save(any());
    }
}
