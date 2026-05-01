-- Transfer system-owned categories to user with phone +972542258808 when that user exists
-- (production data migration). On fresh/local DBs that user is absent; seed categories stay
-- system-owned and the system user remains.

-- 1) Transfer ownership of categories from system user to the real user (only rows join when user exists).
UPDATE categories c
SET owner_id = u.id
FROM users u
WHERE u.phone = '+972542258808'
  AND c.owner_id = '00000000-0000-0000-0000-000000000001';

-- 2–4) Member rows, editor backfill, and removal of the system user — only when target user exists.
DO $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM users WHERE phone = '+972542258808';
  IF target_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE category_members cm
  SET user_id = target_id
  WHERE cm.user_id = '00000000-0000-0000-0000-000000000001'
    AND NOT EXISTS (
      SELECT 1 FROM category_members cm2
      WHERE cm2.category_id = cm.category_id
        AND cm2.user_id = target_id
    );

  UPDATE category_members cm
  SET role = 'owner'
  WHERE cm.user_id = target_id
    AND cm.category_id IN (
      SELECT category_id FROM category_members WHERE user_id = '00000000-0000-0000-0000-000000000001'
    );

  DELETE FROM category_members WHERE user_id = '00000000-0000-0000-0000-000000000001';

  INSERT INTO category_members (category_id, user_id, role)
  SELECT DISTINCT p.category_id, lm.user_id, 'editor'
  FROM list_items li
  JOIN products p ON p.id = li.product_id
  JOIN list_members lm ON lm.list_id = li.list_id
  WHERE lm.user_id != target_id
  ON CONFLICT (category_id, user_id) DO NOTHING;

  DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
END $$;
