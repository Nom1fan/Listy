-- List icon: same options as category/product (emoji icon_id or image_url)
ALTER TABLE lists ADD COLUMN icon_id VARCHAR(64);
ALTER TABLE lists ADD COLUMN image_url VARCHAR(2048);
