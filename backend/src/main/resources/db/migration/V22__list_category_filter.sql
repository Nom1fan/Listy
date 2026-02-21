ALTER TABLE lists ADD COLUMN category_filter_mode VARCHAR(10) NOT NULL DEFAULT 'NONE';

CREATE TABLE list_categories (
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (list_id, category_id)
);
