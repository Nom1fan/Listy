package com.example.demo.list;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GroceryListRepository extends JpaRepository<GroceryList, UUID> {

    List<GroceryList> findByOwnerId(UUID ownerId);
}
