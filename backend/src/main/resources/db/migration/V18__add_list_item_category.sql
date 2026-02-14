-- Allow custom list items to be assigned a category directly (without a product).
ALTER TABLE list_items ADD COLUMN category_id UUID;

ALTER TABLE list_items
    ADD CONSTRAINT fk_list_items_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL;
