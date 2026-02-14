-- Adds unique constraints: category name per workspace, product name per category.
-- Deduplicates any existing violations first (keeps the oldest row).

-- ============================================================
-- 1. Deduplicate categories within workspace
-- ============================================================

-- Repoint products from duplicate categories to the surviving category
WITH survivors AS (
    SELECT DISTINCT ON (workspace_id, name_he) id, workspace_id, name_he
    FROM categories
    ORDER BY workspace_id, name_he, created_at, id
)
UPDATE products p
SET category_id = s.id
FROM categories c
JOIN survivors s ON s.workspace_id = c.workspace_id AND s.name_he = c.name_he
WHERE p.category_id = c.id AND c.id <> s.id;

-- Repoint list_items direct category references from duplicates to survivor
WITH survivors AS (
    SELECT DISTINCT ON (workspace_id, name_he) id, workspace_id, name_he
    FROM categories
    ORDER BY workspace_id, name_he, created_at, id
)
UPDATE list_items li
SET category_id = s.id
FROM categories c
JOIN survivors s ON s.workspace_id = c.workspace_id AND s.name_he = c.name_he
WHERE li.category_id = c.id AND c.id <> s.id;

-- Delete duplicate categories
DELETE FROM categories
WHERE id NOT IN (
    SELECT DISTINCT ON (workspace_id, name_he) id
    FROM categories
    ORDER BY workspace_id, name_he, created_at, id
);

-- ============================================================
-- 2. Deduplicate products within category
--    (including any new duplicates caused by category merges)
-- ============================================================

-- Repoint list_items from duplicate products to the surviving product
WITH survivors AS (
    SELECT DISTINCT ON (category_id, name_he) id, category_id, name_he
    FROM products
    ORDER BY category_id, name_he, created_at, id
)
UPDATE list_items li
SET product_id = s.id
FROM products p
JOIN survivors s ON s.category_id = p.category_id AND s.name_he = p.name_he
WHERE li.product_id = p.id AND p.id <> s.id;

-- Delete duplicate products
DELETE FROM products
WHERE id NOT IN (
    SELECT DISTINCT ON (category_id, name_he) id
    FROM products
    ORDER BY category_id, name_he, created_at, id
);

-- ============================================================
-- 3. Add unique constraints
-- ============================================================
ALTER TABLE categories ADD CONSTRAINT uq_category_name_per_workspace UNIQUE (workspace_id, name_he);
ALTER TABLE products ADD CONSTRAINT uq_product_name_per_category UNIQUE (category_id, name_he);
