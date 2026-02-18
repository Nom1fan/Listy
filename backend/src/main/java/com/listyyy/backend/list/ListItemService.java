package com.listyyy.backend.list;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.exception.ResourceNotFoundException;
import com.listyyy.backend.exception.VersionCheck;
import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.CategoryRepository;
import com.listyyy.backend.productbank.Product;
import com.listyyy.backend.productbank.ProductRepository;
import com.listyyy.backend.websocket.ListEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListItemService {

    private final ListItemRepository listItemRepository;
    private final GroceryListRepository listRepository;
    private final ListAccessService listAccessService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ListEventPublisher listEventPublisher;

    public List<ListItem> getItems(UUID listId, User user) {
        listAccessService.getListOrThrow(listId, user);
        return listItemRepository.findByListIdWithProductAndCategory(listId);
    }

    @Transactional
    public ListItem addItem(UUID listId, User user, AddListItemRequest req) {
        GroceryList list = listAccessService.getListOrThrow(listId, user);
        ListItem item;
        if (req.getProductId() != null) {
            Product product = productRepository.findById(req.getProductId()).orElseThrow(() -> new ResourceNotFoundException("הפריט לא נמצא"));
            // Verify product belongs to the same workspace as the list
            if (product.getCategory() == null || !product.getCategory().getWorkspace().getId().equals(list.getWorkspace().getId())) {
                throw new IllegalArgumentException("הפריט לא שייך למרחב העבודה של הרשימה");
            }
            // Prevent adding the same product twice to a list
            if (listItemRepository.existsByListIdAndProductId(listId, req.getProductId())) {
                throw new IllegalArgumentException("הפריט כבר קיים ברשימה");
            }
            // Use the product's permanent note as default if no note provided on the list item
            String note = req.getNote() != null ? req.getNote() : product.getNote();
            item = ListItem.builder()
                    .list(list)
                    .product(product)
                    .quantity(req.getQuantity() != null ? req.getQuantity() : BigDecimal.ONE)
                    .unit(req.getUnit() != null ? req.getUnit() : product.getDefaultUnit())
                    .note(note)
                    .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                    .itemImageUrl(req.getItemImageUrl())
                    .iconId(req.getIconId())
                    .build();
        } else {
            if (req.getCustomNameHe() == null || req.getCustomNameHe().isBlank()) {
                throw new IllegalArgumentException("יש להזין שם מותאם אישית או לבחור פריט");
            }
            if (req.getCategoryId() != null) {
                final Category category = categoryRepository.findById(req.getCategoryId())
                        .orElseThrow(() -> new ResourceNotFoundException("הקטגוריה לא נמצאה"));
                if (!category.getWorkspace().getId().equals(list.getWorkspace().getId())) {
                    throw new IllegalArgumentException("הקטגוריה לא שייכת למרחב העבודה של הרשימה");
                }
                // Auto-create (or reuse) a product in the product bank so it appears in the Categories page
                Product product = productRepository.findByCategoryIdAndNameHe(category.getId(), req.getCustomNameHe())
                        .orElseGet(() -> productRepository.save(Product.builder()
                                .category(category)
                                .nameHe(req.getCustomNameHe())
                                .defaultUnit(req.getUnit() != null ? req.getUnit() : "יחידה")
                                .iconId(req.getIconId())
                                .imageUrl(req.getItemImageUrl())
                                .note(req.getNote())
                                .build()));
                // Prevent adding the same product twice to a list
                if (listItemRepository.existsByListIdAndProductId(listId, product.getId())) {
                    throw new IllegalArgumentException("הפריט כבר קיים ברשימה");
                }
                item = ListItem.builder()
                        .list(list)
                        .product(product)
                        .quantity(req.getQuantity() != null ? req.getQuantity() : BigDecimal.ONE)
                        .unit(req.getUnit() != null ? req.getUnit() : product.getDefaultUnit())
                        .note(req.getNote() != null ? req.getNote() : product.getNote())
                        .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                        .itemImageUrl(req.getItemImageUrl())
                        .iconId(req.getIconId())
                        .build();
            } else {
                // No category — pure custom item
                if (listItemRepository.existsByListIdAndCustomNameHe(listId, req.getCustomNameHe())) {
                    throw new IllegalArgumentException("פריט בשם זה כבר קיים ברשימה");
                }
                item = ListItem.builder()
                        .list(list)
                        .customNameHe(req.getCustomNameHe())
                        .quantity(req.getQuantity() != null ? req.getQuantity() : BigDecimal.ONE)
                        .unit(req.getUnit() != null ? req.getUnit() : "יחידה")
                        .note(req.getNote())
                        .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                        .itemImageUrl(req.getItemImageUrl())
                        .iconId(req.getIconId())
                        .build();
            }
        }
        item = listItemRepository.save(item);
        listEventPublisher.publishItemAdded(listId, item, user);
        return item;
    }

    @Transactional
    public ListItem updateItem(UUID listId, UUID itemId, User user, UpdateListItemRequest req) {
        ListItem item = getItemOrThrow(listId, itemId, user);
        VersionCheck.check(req.getVersion(), item.getVersion());
        if (req.getQuantity() != null) item.setQuantity(req.getQuantity());
        if (req.getUnit() != null) item.setUnit(req.getUnit());
        if (req.getNote() != null) item.setNote(req.getNote());
        if (req.getCrossedOff() != null) item.setCrossedOff(req.getCrossedOff());
        if (req.getCustomNameHe() != null && item.getProduct() == null) item.setCustomNameHe(req.getCustomNameHe());
        if (req.getItemImageUrl() != null) item.setItemImageUrl(req.getItemImageUrl().isBlank() ? null : req.getItemImageUrl());
        if (req.getIconId() != null) item.setIconId(req.getIconId().isBlank() ? null : req.getIconId());
        // Move item to a different category
        if (req.getCategoryId() != null) {
            GroceryList list = item.getList();
            Category newCategory = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("הקטגוריה לא נמצאה"));
            if (!newCategory.getWorkspace().getId().equals(list.getWorkspace().getId())) {
                throw new IllegalArgumentException("הקטגוריה לא שייכת למרחב העבודה של הרשימה");
            }
            if (item.getProduct() != null) {
                // Move the underlying product to the new category
                Product product = item.getProduct();
                if (!req.getCategoryId().equals(product.getCategory().getId())) {
                    product.setCategory(newCategory);
                    productRepository.save(product);
                }
            } else {
                // Custom item with no product: create a product in the new category and link it
                String itemName = item.getCustomNameHe() != null ? item.getCustomNameHe() : "";
                String itemUnit = item.getUnit();
                String itemIconId = item.getIconId();
                String itemImageUrl = item.getItemImageUrl();
                String itemNote = item.getNote();
                Product product = productRepository.findByCategoryIdAndNameHe(req.getCategoryId(), itemName)
                        .orElseGet(() -> productRepository.save(Product.builder()
                                .category(newCategory)
                                .nameHe(itemName)
                                .defaultUnit(itemUnit)
                                .iconId(itemIconId)
                                .imageUrl(itemImageUrl)
                                .note(itemNote)
                                .build()));
                item.setProduct(product);
                item.setCategory(null);
                item.setCustomNameHe(null);
            }
        }
        item = listItemRepository.save(item);
        listEventPublisher.publishItemUpdated(listId, item, user);
        return item;
    }

    @Transactional
    public void removeItem(UUID listId, UUID itemId, User user) {
        ListItem item = getItemOrThrow(listId, itemId, user);
        String displayName = item.getDisplayName();
        String quantityUnit = item.getQuantity() + " " + item.getUnit();
        listItemRepository.delete(item);
        listEventPublisher.publishItemRemoved(listId, itemId, displayName, quantityUnit, user);
    }

    @Transactional
    public void reorderItems(UUID listId, User user, List<UUID> itemIds) {
        listAccessService.getListOrThrow(listId, user);
        for (int i = 0; i < itemIds.size(); i++) {
            ListItem item = listItemRepository.findById(itemIds.get(i))
                    .orElseThrow(() -> new ResourceNotFoundException("הפריט לא נמצא"));
            if (!item.getList().getId().equals(listId)) {
                throw new IllegalArgumentException("הפריט לא שייך לרשימה");
            }
            if (item.getSortOrder() != i) {
                item.setSortOrder(i);
                listItemRepository.save(item);
            }
        }
    }

    private ListItem getItemOrThrow(UUID listId, UUID itemId, User user) {
        listAccessService.getListOrThrow(listId, user);
        ListItem item = listItemRepository.findById(itemId).orElseThrow(() -> new ResourceNotFoundException("הפריט לא נמצא"));
        if (!item.getList().getId().equals(listId)) throw new IllegalArgumentException("הפריט לא שייך לרשימה");
        return item;
    }
}
