package com.example.demo.sharing;

import com.example.demo.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/members")
@RequiredArgsConstructor
public class SharingController {

    private final SharingService sharingService;

    @GetMapping
    public ResponseEntity<List<ListMemberDto>> getMembers(
            @PathVariable UUID listId,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(sharingService.getMembers(listId, user));
    }

    @PostMapping
    public ResponseEntity<ListMemberDto> invite(
            @PathVariable UUID listId,
            @AuthenticationPrincipal User user,
            @RequestBody InviteRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(sharingService.invite(listId, user, req));
    }

    @DeleteMapping("/{memberUserId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID listId,
            @PathVariable UUID memberUserId,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        sharingService.removeMember(listId, memberUserId, user);
        return ResponseEntity.noContent().build();
    }
}