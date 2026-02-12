package com.example.demo.sharing;

import com.example.demo.auth.User;
import com.example.demo.auth.UserRepository;
import com.example.demo.list.GroceryList;
import com.example.demo.list.ListMember;
import com.example.demo.list.ListMemberRepository;
import com.example.demo.list.ListAccessService;
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
            throw new IllegalArgumentException("Only owner can invite");
        }
        User invitee = null;
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            invitee = userRepository.findByEmail(req.getEmail().trim()).orElseThrow(() -> new IllegalArgumentException("User not found with this email"));
        } else if (req.getPhone() != null && !req.getPhone().isBlank()) {
            invitee = userRepository.findByPhone(req.getPhone().trim()).orElseThrow(() -> new IllegalArgumentException("User not found with this phone number"));
        }
        if (invitee == null) throw new IllegalArgumentException("Provide email or phone");
        if (invitee.getId().equals(user.getId())) throw new IllegalArgumentException("Cannot invite yourself");
        if (listMemberRepository.existsByListIdAndUserId(listId, invitee.getId())) {
            throw new IllegalArgumentException("User is already a member");
        }
        ListMember member = new ListMember();
        member.setListId(listId);
        member.setUserId(invitee.getId());
        member.setList(list);
        member.setUser(invitee);
        member.setRole("editor");
        listMemberRepository.save(member);
        return ListMemberDto.builder()
                .userId(invitee.getId())
                .displayName(invitee.getDisplayName())
                .email(invitee.getEmail())
                .phone(invitee.getPhone())
                .role("editor")
                .build();
    }

    @Transactional
    public void removeMember(UUID listId, UUID memberUserId, User user) {
        GroceryList list = listAccessService.getListOrThrow(listId, user);
        if (list.getOwner().getId().equals(memberUserId)) {
            throw new IllegalArgumentException("Cannot remove list owner");
        }
        if (!list.getOwner().getId().equals(user.getId()) && !user.getId().equals(memberUserId)) {
            throw new IllegalArgumentException("Only owner can remove others; you can leave by removing yourself");
        }
        listMemberRepository.findByListIdAndUserId(listId, memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        listMemberRepository.deleteById(new com.example.demo.list.ListMemberId(listId, memberUserId));
    }
}