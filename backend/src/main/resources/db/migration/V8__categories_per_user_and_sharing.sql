-- Categories per user: owner + sharing (like lists)
-- 1) System user for existing seed categories (visible to all). Use ON CONFLICT so re-runs are safe.
INSERT INTO users (id, email, display_name, locale)
VALUES ('00000000-0000-0000-0000-000000000001', 'system@listy.local', 'System', 'he')
ON CONFLICT (id) DO NOTHING;

-- 2) Add owner to categories
ALTER TABLE categories ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE CASCADE;
UPDATE categories SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
ALTER TABLE categories ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX idx_categories_owner ON categories(owner_id);

-- 3) Category members (sharing, like list_members)
CREATE TABLE category_members (
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'editor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id, user_id),
    CONSTRAINT category_valid_role CHECK (role IN ('owner', 'editor'))
);
CREATE INDEX idx_category_members_user ON category_members(user_id);

-- 4) Backfill: owner is also a member with role 'owner'
INSERT INTO category_members (category_id, user_id, role)
SELECT id, owner_id, 'owner' FROM categories
ON CONFLICT (category_id, user_id) DO NOTHING;
