# Deploying Content OS to Hostinger

Content OS is a Next.js 16 app with a server (Server Actions + a local SQLite
database), so it needs to run as a **Node.js process** — it is not a static
site. Hostinger offers two ways to run Node, both covered below.

> **Requirements on the host**
> - **Node.js 20.9+** (Next.js 16 requirement — pick this in hPanel/VPS).
>   Use Node **20 or 22**, for which `better-sqlite3` ships a prebuilt binary.
> - The database is created and seeded automatically on first run.
> - **Run `npm install` on the server** (not by uploading a local
>   `node_modules`). `better-sqlite3` is a native module, but on Linux x64 with
>   Node 20/22 it downloads a **prebuilt binary** — no compiler or build tools
>   required. Installing on the host guarantees the binary matches the machine.

---

## Option A — Hostinger VPS (recommended)

Full control, most reliable. You get SSH and can run the app with PM2 behind
Hostinger's nginx/OpenLiteSpeed or Node directly.

```bash
# 1. SSH into the VPS, install Node 20+ (via nvm or Hostinger's template)

# 2. Get the code
git clone <your-repo-url> content-os
cd content-os

# 3. Install + build (compiles better-sqlite3 for this machine)
npm ci
npm run build

# 4. Choose a persistent DB location that survives redeploys
export DATA_DIR=/home/$USER/content-os-data
export PORT=3000

# 5. Run it with PM2 so it stays up and restarts on reboot
npm i -g pm2
pm2 start npm --name content-os -- start        # runs `next start`
pm2 save
pm2 startup                                      # follow the printed command
```

Then put your domain in front of it with a reverse proxy to `127.0.0.1:3000`.
Example nginx server block:

```nginx
server {
  listen 80;
  server_name yourdomain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Add HTTPS with Hostinger's SSL or `certbot`. To update later:
`git pull && npm ci && npm run build && pm2 restart content-os`.

---

## Option B — Hostinger shared/cloud "Node.js app" (hPanel / Passenger)

Available on Premium, Business and Cloud web-hosting plans.

1. **hPanel → Advanced → Node.js** → **Create application**.
   - **Node.js version:** 20 or higher.
   - **Application root:** the folder you'll upload the project into
     (e.g. `content-os`).
   - **Application startup file:** `server.js` (included in this repo).
   - **Application URL:** your domain/subdomain.
2. **Upload the project** into the application root — either with Git (hPanel can
   clone your repo) or by uploading the files via File Manager / SFTP. Do **not**
   upload `node_modules` or `.next`; you'll build on the server.
3. Open the app's **terminal** (hPanel provides one for the Node app, or use
   SSH) in the application root and run:
   ```bash
   npm install
   npm run build
   ```
4. **Environment variables** (in the Node.js app panel):
   - `DATA_DIR` → an absolute, writable path **outside** the app root so your
     data survives redeploys, e.g. `/home/uXXXXXXXX/content-os-data`.
   - `PORT` is normally provided by Passenger — leave it unless told otherwise.
5. **Restart** the application from the panel. Passenger runs `server.js`, which
   boots the built Next.js server.

> **Database note:** on Node 20/22 (Linux x64) `better-sqlite3` installs a
> prebuilt binary, so no build tools are needed. In the rare case a shared plan
> blocks it, the data layer can be switched to Hostinger's included **MySQL** —
> the schema in [`lib/db/schema.ts`](lib/db/schema.ts) ports directly. Ask and
> this can be wired up.

---

## Environment variables

| Variable   | Purpose                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `PORT`     | Port to listen on (default `3000`; usually set by the host).            |
| `DATA_DIR` | Directory for `content-os.db`. Use a persistent path outside the app.   |

See [`.env.example`](.env.example).

## Notes & gotchas

- **Persistence:** keep `DATA_DIR` outside the app folder. If it points inside
  the deploy directory, a redeploy that replaces files can wipe your database.
- **First run:** the DB is auto-created and seeded with demo content. To start
  empty, delete the `content-os.db*` files in `DATA_DIR` and restart.
- **Backups:** the entire database is the `content-os.db` file (plus `-wal` /
  `-shm`). Copy it to back up; restore by copying it back and restarting.
- **Memory:** `npm run build` uses Turbopack and benefits from ≥1 GB RAM. On a
  tiny shared plan, if the build is killed, build on a VPS or locally on the
  same Linux/x64 architecture and upload the `.next` folder together with a
  server-side `npm install` for the native module.
