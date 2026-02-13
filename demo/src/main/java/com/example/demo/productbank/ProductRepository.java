package com.example.demo.productbank;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByCategoryIdOrderByNameHe(UUID categoryId);

    List<Product> findByCategory_IdIn(Set<UUID> categoryIds, Sort sort);

    List<Product> findByNameHeContainingIgnoreCase(String nameHe);
}
