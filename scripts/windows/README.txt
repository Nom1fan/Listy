Listy – run on Windows (no repo, no Cursor needed)
=================================================

1. Install Docker Desktop for Windows
   https://www.docker.com/products/docker-desktop/
   Then start Docker Desktop.

2. (Optional) Use your existing data
   If you have db/listy-db.sql from your Mac (exported with scripts/export-db.sh),
   put it in the "db" folder before first run. It will be imported automatically.
   If the db folder is empty, the app will start with an empty database (schema
   is created by the app).

3. Run the app
   Double-click run.bat
   Or open a terminal in this folder and run: docker compose up

4. Open in browser
   http://localhost:8080
   From your phone (same WiFi): http://YOUR_PC_IP:8080 (find IP with ipconfig)

To stop: press Ctrl+C in the window, or run "docker compose down".
