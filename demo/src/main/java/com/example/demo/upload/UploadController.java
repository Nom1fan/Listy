package com.example.demo.upload;

import com.example.demo.auth.User;
import com.example.demo.list.GroceryListRepository;
import com.example.demo.list.ListAccessService;
import com.example.demo.list.ListItem;
import com.example.demo.list.ListItemRepository;
import com.example.demo.productbank.Category;
import com.example.demo.productbank.CategoryRepository;
import com.example.demo.productbank.Product;
import com.example.demo.productbank.ProductRepository;
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
    private final CategoryRepository categoryRepository;
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
        Category cat = categoryRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Category not found"));
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
        Product product = productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found"));
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
        var list = groceryListRepository.findById(listId).orElseThrow(() -> new IllegalArgumentException("List not found"));
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
        ListItem item = listItemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item not found"));
        if (!item.getList().getId().equals(listId)) throw new IllegalArgumentException("Item not in list");
        String url = uploadService.saveListItemImage(file);
        item.setItemImageUrl(url);
        listItemRepository.save(item);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
