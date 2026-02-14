package com.listyyy.backend.upload;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.list.GroceryListRepository;
import com.listyyy.backend.list.ListAccessService;
import com.listyyy.backend.list.ListItem;
import com.listyyy.backend.list.ListItemRepository;
import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.CategoryAccessService;
import com.listyyy.backend.productbank.CategoryRepository;
import com.listyyy.backend.productbank.Product;
import com.listyyy.backend.productbank.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryAccessService categoryAccessService;
    private final ProductRepository productRepository;
    private final ListItemRepository listItemRepository;
    private final GroceryListRepository groceryListRepository;
    private final ListAccessService listAccessService;

    @PostMapping("/upload/category/{id}")
    public ResponseEntity<Map<String, String>> uploadCategoryImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) throws IOException {
        if (user == null) return ResponseEntity.status(401).build();
        Category cat = categoryAccessService.getCategoryOrThrow(id, user);
        if (!categoryAccessService.canEdit(user, id)) throw new IllegalArgumentException("אין גישה");
        String url = uploadService.saveCategoryImage(file);
        cat.setImageUrl(url);
        categoryRepository.save(cat);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/upload/product/{id}")
    public ResponseEntity<Map<String, String>> uploadProductImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) throws IOException {
        if (user == null) return ResponseEntity.status(401).build();
        Product product = productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("המוצר לא נמצא"));
        categoryAccessService.getCategoryOrThrow(product.getCategory().getId(), user);
        if (!categoryAccessService.canEdit(user, product.getCategory().getId())) throw new IllegalArgumentException("אין גישה");
        String url = uploadService.saveProductImage(file);
        product.setImageUrl(url);
        productRepository.save(product);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/upload/list/{listId}")
    public ResponseEntity<Map<String, String>> uploadListImage(
            @PathVariable UUID listId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) throws IOException {
        if (user == null) return ResponseEntity.status(401).build();
        listAccessService.getListOrThrow(listId, user);
        if (!listAccessService.canEdit(user, listId)) return ResponseEntity.status(403).build();
        var list = groceryListRepository.findById(listId).orElseThrow(() -> new IllegalArgumentException("הרשימה לא נמצאה"));
        String url = uploadService.saveListImage(file);
        list.setImageUrl(url);
        groceryListRepository.save(list);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/upload/lists/{listId}/items/{itemId}")
    public ResponseEntity<Map<String, String>> uploadListItemImage(
            @PathVariable UUID listId,
            @PathVariable UUID itemId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) throws IOException {
        if (user == null) return ResponseEntity.status(401).build();
        listAccessService.getListOrThrow(listId, user);
        ListItem item = listItemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("הפריט לא נמצא"));
        if (!item.getList().getId().equals(listId)) throw new IllegalArgumentException("הפריט לא שייך לרשימה");
        String url = uploadService.saveListItemImage(file);
        item.setItemImageUrl(url);
        listItemRepository.save(item);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/upload/profile")
    public ResponseEntity<Map<String, String>> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) throws IOException {
        if (user == null) return ResponseEntity.status(401).build();
        String url = uploadService.saveProfileImage(file);
        user.setProfileImageUrl(url);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
