-- Adds unique constraint: list name per workspace.
-- Deduplicates any existing violations first (keeps the oldest row).

-- Repoint list_items from duplicate lists to the surviving list
WITH survivors AS (
    SELECT DISTINCT ON (workspace_id, name) id, workspace_id, name
    FROM lists
    ORDER BY workspace_id, name, created_at, id
)
UPDATE list_items li
SET list_id = s.id
FROM lists l
JOIN survivors s ON s.workspace_id = l.workspace_id AND s.name = l.name
WHERE li.list_id = l.id AND l.id <> s.id;

-- Delete duplicate lists
DELETE FROM lists
WHERE id NOT IN (
    SELECT DISTINCT ON (workspace_id, name) id
    FROM lists
    ORDER BY workspace_id, name, created_at, id
);

-- Add unique constraint
ALTER TABLE lists ADD CONSTRAINT uq_list_name_per_workspace UNIQUE (workspace_id, name);
