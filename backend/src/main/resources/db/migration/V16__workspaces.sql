-- ======================================================================
-- V16: Introduce workspaces
-- 
-- A workspace groups categories and lists under a single sharing boundary.
-- - Each user gets a default workspace for their existing data.
-- - Categories and lists get a workspace_id FK.
-- - category_members and list_members are migrated to workspace_members.
-- - Per-category sharing (category_members) is dropped.
-- - Per-list sharing (list_members) is dropped; list access is now via workspace.
-- ======================================================================

-- 1. Create workspaces table
CREATE TABLE workspaces (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    icon_id    VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create workspace_members table
CREATE TABLE workspace_members (
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(20) NOT NULL DEFAULT 'editor',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);

-- 3. Add workspace_id to categories (nullable initially for migration)
ALTER TABLE categories ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 4. Add workspace_id to lists (nullable initially for migration)
ALTER TABLE lists ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- 5. For each user who owns categories or lists, create a default workspace
--    and assign them as workspace owner.
DO $$
DECLARE
    r RECORD;
    ws_id UUID;
BEGIN
    -- All users who own at least one category or list
    FOR r IN
        SELECT DISTINCT u.id AS user_id
        FROM users u
        WHERE EXISTS (SELECT 1 FROM categories c WHERE c.owner_id = u.id)
           OR EXISTS (SELECT 1 FROM lists l WHERE l.owner_id = u.id)
    LOOP
        -- Create workspace
        INSERT INTO workspaces (id, name, created_at)
        VALUES (gen_random_uuid(), 'הרשימות שלי', now())
        RETURNING id INTO ws_id;

        -- Add user as workspace owner
        INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
        VALUES (ws_id, r.user_id, 'owner', now());

        -- Assign all owned categories to this workspace
        UPDATE categories SET workspace_id = ws_id WHERE owner_id = r.user_id;

        -- Assign all owned lists to this workspace
        UPDATE lists SET workspace_id = ws_id WHERE owner_id = r.user_id;

        -- Migrate category_members (non-owner editors) to workspace_members
        INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
        SELECT ws_id, cm.user_id, 'editor', MIN(cm.created_at)
        FROM category_members cm
        JOIN categories c ON c.id = cm.category_id
        WHERE c.owner_id = r.user_id
          AND cm.user_id <> r.user_id
        GROUP BY cm.user_id
        ON CONFLICT (workspace_id, user_id) DO NOTHING;

        -- Migrate list_members (non-owner editors) to workspace_members
        INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
        SELECT ws_id, lm.user_id, 'editor', MIN(lm.created_at)
        FROM list_members lm
        JOIN lists l ON l.id = lm.list_id
        WHERE l.owner_id = r.user_id
          AND lm.user_id <> r.user_id
        GROUP BY lm.user_id
        ON CONFLICT (workspace_id, user_id) DO NOTHING;
    END LOOP;
END $$;

-- 6. Make workspace_id NOT NULL on categories and lists
ALTER TABLE categories ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE lists ALTER COLUMN workspace_id SET NOT NULL;

-- 7. Drop the old per-category sharing tables
DROP TABLE IF EXISTS category_members;

-- 8. Drop the old per-list sharing table
DROP TABLE IF EXISTS list_members;

-- 9. Drop owner_id from categories (workspace replaces it)
ALTER TABLE categories DROP COLUMN owner_id;

-- 10. Drop owner_id from lists (workspace replaces it)
ALTER TABLE lists DROP COLUMN owner_id;
