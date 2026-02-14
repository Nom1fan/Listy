package com.listyyy.backend.list;

import com.listyyy.backend.auth.User;
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
            Product product = productRepository.findById(req.getProductId()).orElseThrow(() -> new IllegalArgumentException("המוצר לא נמצא"));
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
                throw new IllegalArgumentException("יש להזין שם מותאם אישית או לבחור מוצר");
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
        item = listItemRepository.save(item);
        listEventPublisher.publishItemAdded(listId, item, user);
        return item;
    }

    @Transactional
    public ListItem updateItem(UUID listId, UUID itemId, User user, UpdateListItemRequest req) {
        ListItem item = getItemOrThrow(listId, itemId, user);
        if (req.getQuantity() != null) item.setQuantity(req.getQuantity());
        if (req.getUnit() != null) item.setUnit(req.getUnit());
        if (req.getNote() != null) item.setNote(req.getNote());
        if (req.getCrossedOff() != null) item.setCrossedOff(req.getCrossedOff());
        if (req.getCustomNameHe() != null && item.getProduct() == null) item.setCustomNameHe(req.getCustomNameHe());
        if (req.getItemImageUrl() != null) item.setItemImageUrl(req.getItemImageUrl().isBlank() ? null : req.getItemImageUrl());
        if (req.getIconId() != null) item.setIconId(req.getIconId().isBlank() ? null : req.getIconId());
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

    private ListItem getItemOrThrow(UUID listId, UUID itemId, User user) {
        listAccessService.getListOrThrow(listId, user);
        ListItem item = listItemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("הפריט לא נמצא"));
        if (!item.getList().getId().equals(listId)) throw new IllegalArgumentException("הפריט לא שייך לרשימה");
        return item;
    }
}
