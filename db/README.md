# Database dump for Listy

Place the exported database here so you can restore it on another machine.

- **Export (source machine):** From repo root run `./scripts/export-db.sh`.  
  This creates/overwrites `listy-db.sql` with a full dump (schema + data).  
  Commit and push `db/listy-db.sql`.

- **Import (other machine):** After cloning the repo and installing PostgreSQL, run  
  `./scripts/import-db.sh`.  
  It creates the `listy` database if needed and loads the dump.

**Windows:** Use the same idea with `pg_dump` and `psql` from the PostgreSQL bin directory, or use WSL and run the scripts. Example (PowerShell, from repo root):

```powershell
# Export
mkdir -Force db; pg_dump -U postgres -h localhost -p 5432 --no-owner --no-acl listy -f db/listy-db.sql

# Import (create DB first: createdb -U postgres listy)
psql -U postgres -h localhost -p 5432 -d listy -f db/listy-db.sql
```
