package com.example.demo.productbank;

import com.example.demo.auth.User;
import com.example.demo.sharing.InviteRequest;
import com.example.demo.sharing.ListMemberDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories/{categoryId}/members")
@RequiredArgsConstructor
public class CategorySharingController {

    private final CategorySharingService categorySharingService;

    @GetMapping
    public ResponseEntity<List<ListMemberDto>> getMembers(
            @PathVariable UUID categoryId,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(categorySharingService.getMembers(categoryId, user));
    }

    @PostMapping
    public ResponseEntity<ListMemberDto> invite(
            @PathVariable UUID categoryId,
            @AuthenticationPrincipal User user,
            @RequestBody InviteRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(categorySharingService.invite(categoryId, user, req));
    }

    @DeleteMapping("/{memberUserId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID categoryId,
            @PathVariable UUID memberUserId,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        categorySharingService.removeMember(categoryId, memberUserId, user);
        return ResponseEntity.noContent().build();
    }
}
