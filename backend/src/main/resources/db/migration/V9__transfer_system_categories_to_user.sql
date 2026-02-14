-- Transfer all system-owned categories to user with phone +972542258808.
-- After this, there are no system-owned categories; new users start with zero categories.

-- 1) Transfer ownership of categories from system user to the real user.
UPDATE categories
SET owner_id = (SELECT id FROM users WHERE phone = '+972542258808')
WHERE owner_id = '00000000-0000-0000-0000-000000000001';

-- 2) Replace the system user's category_members 'owner' rows with the real user.
UPDATE category_members
SET user_id = (SELECT id FROM users WHERE phone = '+972542258808')
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (
    SELECT 1 FROM category_members cm2
    WHERE cm2.category_id = category_members.category_id
      AND cm2.user_id = (SELECT id FROM users WHERE phone = '+972542258808')
  );

-- If real user was already a member (editor) of some categories, remove the duplicate system rows
-- and promote the real user's existing row to 'owner'.
UPDATE category_members
SET role = 'owner'
WHERE user_id = (SELECT id FROM users WHERE phone = '+972542258808')
  AND category_id IN (
    SELECT category_id FROM category_members WHERE user_id = '00000000-0000-0000-0000-000000000001'
  );

DELETE FROM category_members WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- 3) Backfill: add list co-members as category editors.
--    For each transferred category, find users who are members of lists that contain items
--    from products in that category. This fixes the fact that auto-share was skipped for
--    system-owned categories.
INSERT INTO category_members (category_id, user_id, role)
SELECT DISTINCT p.category_id, lm.user_id, 'editor'
FROM list_items li
JOIN products p ON p.id = li.product_id
JOIN list_members lm ON lm.list_id = li.list_id
WHERE lm.user_id != (SELECT id FROM users WHERE phone = '+972542258808')
ON CONFLICT (category_id, user_id) DO NOTHING;

-- 4) Remove the system user (no longer needed).
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
