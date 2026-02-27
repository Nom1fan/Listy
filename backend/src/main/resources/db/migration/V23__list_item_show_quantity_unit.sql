-- When true, show quantity and unit on the list even if it's "1 יחידה" (user explicitly expanded unit section and saved)
ALTER TABLE list_items ADD COLUMN show_quantity_unit BOOLEAN NOT NULL DEFAULT FALSE;
