-- Backfill: add list co-members as category editors.
-- For each category, find users who are members of lists that contain items
-- from products in that category. This fixes the fact that auto-share was skipped
-- for previously system-owned categories.
INSERT INTO category_members (category_id, user_id, role)
SELECT DISTINCT p.category_id, lm.user_id, 'editor'
FROM list_items li
JOIN products p ON p.id = li.product_id
JOIN list_members lm ON lm.list_id = li.list_id
WHERE lm.user_id != (SELECT id FROM users WHERE phone = '+972542258808')
ON CONFLICT (category_id, user_id) DO NOTHING;
