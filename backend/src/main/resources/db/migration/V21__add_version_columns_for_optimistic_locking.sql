-- Add optimistic-locking version columns to all shared entities.
-- Hibernate @Version will auto-increment on each UPDATE.

ALTER TABLE workspaces  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE categories  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE products    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE lists       ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE list_items  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
