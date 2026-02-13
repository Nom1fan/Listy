-- Add sort_order column to lists for user-defined ordering
ALTER TABLE lists ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
