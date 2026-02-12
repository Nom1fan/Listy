-- Optional: remove אבטיח (watermelon) from product bank manually.
-- Run with: psql -h localhost -U postgres -d listy -f scripts/repair-flyway-v6.sql
-- Or delete the product from the Categories page in the app once the server is running.
UPDATE list_items
SET custom_name_he = 'אבטיח', product_id = NULL
WHERE product_id = 'b000000f-0000-0000-0000-00000000000f';
DELETE FROM products WHERE id = 'b000000f-0000-0000-0000-00000000000f';
