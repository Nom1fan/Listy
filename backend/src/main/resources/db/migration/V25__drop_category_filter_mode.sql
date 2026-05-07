-- Replace the 3-mode category filter (NONE/INCLUDE/EXCLUDE) with a flat
-- "attached categories" model. After this migration, `list_categories`
-- alone determines the categories a list is associated with.
--
-- Backfill semantics (preserve current behavior):
--   NONE    -> attach all workspace categories (NONE today means "all are available")
--   EXCLUDE -> attach the complement (workspace cats MINUS the originally excluded ones)
--   INCLUDE -> keep list_categories as-is (these were already the selected categories)

-- 1) NONE: attach all workspace categories
INSERT INTO list_categories (list_id, category_id)
SELECT l.id, c.id
FROM lists l
JOIN categories c ON c.workspace_id = l.workspace_id
WHERE l.category_filter_mode = 'NONE'
ON CONFLICT (list_id, category_id) DO NOTHING;

-- 2) EXCLUDE: capture original "excluded" pairs before mutation, then invert
CREATE TEMP TABLE _excluded_pairs AS
SELECT lc.list_id, lc.category_id
FROM list_categories lc
JOIN lists l ON l.id = lc.list_id
WHERE l.category_filter_mode = 'EXCLUDE';

INSERT INTO list_categories (list_id, category_id)
SELECT l.id, c.id
FROM lists l
JOIN categories c ON c.workspace_id = l.workspace_id
WHERE l.category_filter_mode = 'EXCLUDE'
  AND NOT EXISTS (
      SELECT 1 FROM _excluded_pairs ep
      WHERE ep.list_id = l.id AND ep.category_id = c.id
  )
ON CONFLICT (list_id, category_id) DO NOTHING;

DELETE FROM list_categories lc
USING _excluded_pairs ep
WHERE lc.list_id = ep.list_id AND lc.category_id = ep.category_id;

DROP TABLE _excluded_pairs;

-- 3) Drop the column; INCLUDE rows already match the new model
ALTER TABLE lists DROP COLUMN category_filter_mode;
