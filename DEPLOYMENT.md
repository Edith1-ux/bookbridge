# 📚 BookBridgee — Production Deployment & Operations Guide

This guide details configuring, deploying, and operating BookBridgee with MySQL and Gunicorn on Render, Docker, or any cloud Linux host.

> [!IMPORTANT]
> **Use MySQL in local and production environments. Do not use SQLite in production.**
> Do not use Node.js, Express, MongoDB, SQLite, localStorage, IndexedDB, or JSON files as the production backend/database.
> If local browser storage remains, it may only store non-sensitive UI preferences (such as theme or temporary form drafts)—never users, passwords, listings, messages, transactions, or authentication data.

---

## 🔧 Production Environment Checklist

Before launching to production, set the following environment variables:

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `SECRET_KEY` | Auto-generated or custom 64+ char key | Cryptographic key for JWT & sessions |
| `DEBUG` | `False` | Disables debug mode and detailed error stack traces |
| `ALLOWED_HOSTS` | `book-bridge-2.onrender.com,.onrender.com` | Allowed hostnames |
| `MYSQL_HOST` | Hostname from cloud MySQL provider (e.g. TiDB Cloud / Aiven) | Cloud MySQL server host |
| `MYSQL_PORT` | `3306` (or `4000` for TiDB Cloud) | MySQL port |
| `MYSQL_DATABASE` | `bookbridge_db` | MySQL database name |
| `MYSQL_USER` | Your cloud database user | MySQL database username |
| `MYSQL_PASSWORD` | Your real secure MySQL password | MySQL database password |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com,https://book-bridge-2.onrender.com` | Whitelisted cross-origin domains |
| `CSRF_TRUSTED_ORIGINS` | `https://yourdomain.com,https://book-bridge-2.onrender.com` | Trusted CSRF origins |
| `SECURE_SSL_REDIRECT` | `True` | Enforce HTTPS redirects |
| `DEMO_MODE` | `false` | Disables demo fallback mode |

---

## 🚀 Permanent Data Storage on Render (Render.com)

Render web services run in **stateless containers**. On the free tier, Render automatically spins down services after 15 minutes of inactivity. When restarted or redeployed, any local file created inside the temporary container (such as the default `db.sqlite3`) is reset to the git commit state.

To make sure your **user logins, student registrations, book listings, and uploaded photos remain permanently stored forever** (until deleted or sold), choose one of the following 3 production-grade options:

### 🌟 Option 1: Native Render PostgreSQL (Recommended — 1-Click Setup)
Render provides managed PostgreSQL that persists permanently across all redeploys, restarts, and sleep cycles.
1. In the [Render Dashboard](https://dashboard.render.com/):
   - Click **New +** → **PostgreSQL**.
   - Name it `bookbridge-db` and select the **Free** instance type.
   - Click **Create Database**.
2. Once provisioned, copy the **Internal Database URL** (e.g. `postgres://bookbridge_user:...@dpg-...-a/bookbridge_db`).
3. Open your **BookBridge Web Service** in Render:
   - Go to **Environment**.
   - Add an environment variable:
     - **Key**: `DATABASE_URL`
     - **Value**: *(paste your copied Internal Database URL)*
4. Click **Save Changes**. Render will automatically redeploy. Your database is now permanent and will never lose any listings or accounts!

### 🐬 Option 2: Managed Cloud MySQL (TiDB Serverless or Aiven)
1. Create a free MySQL cluster on [TiDB Cloud](https://tidbcloud.com/) or [Aiven](https://aiven.io/).
2. Under your cluster, get your connection credentials:
   - **Host**: e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`
   - **Port**: `4000` (or `3306`)
   - **Database**: `bookbridge_db`
   - **User**: your full username (including cluster prefix for TiDB)
   - **Password**: your database password
3. In your Render Web Service **Environment**:
   - Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_SSL=true`.
   *(Or simply set `DATABASE_URL=mysql://user:pass@host:port/database`)*

### 💾 Option 3: Render Persistent Disk (For SQLite & Media Files)
If you prefer using SQLite without external database servers:
1. In your Render Web Service settings, scroll down to **Disks**.
2. Click **Add Disk**:
   - **Name**: `bookbridge-data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB` (or more)
3. Click **Save Changes**.
4. BookBridge automatically detects `/var/data` and stores both `db.sqlite3` and uploaded book covers in `/var/data/` permanently across all redeploys and restarts!

---

## 🐳 Docker Deployment

### Building and Running with Docker Compose (Django + MySQL + Redis)

```bash
# Launch MySQL 8.0, Redis 7, and Daphne ASGI Web Service
docker-compose up -d --build
```

### Standalone Docker Container

```bash
# Build production Docker image
docker build -t bookbridge:latest .

# Run container with environment variables
docker run -d -p 8000:8000 \
  -e SECRET_KEY="your-production-secret-key" \
  -e DEBUG="False" \
  -e ALLOWED_HOSTS="localhost,127.0.0.1" \
  -e MYSQL_HOST="mysql-server-host" \
  -e MYSQL_PORT="3306" \
  -e MYSQL_DATABASE="bookbridge_db" \
  -e MYSQL_USER="db_user" \
  -e MYSQL_PASSWORD="db_password" \
  --name bookbridge_app bookbridge:latest
```

---

## 🩺 Health Checks & Monitoring

- **Health Endpoint**: `GET /api/health`
  - Returns `200 OK` with database connectivity status and service version.
  - Returns `503 Service Unavailable` if database queries fail.
- **Platform Analytics**: `GET /api/statistics`
  - Real-time active student counts, listed books, and successful transactions.

---

## 🛡️ Database Migrations & Backup

```bash
# Run database migrations in release phase
python backend/manage.py migrate

# Seed initial academic catalog
python backend/manage.py seed_db
```
> [!IMPORTANT]
> Never run `makemigrations` in production containers. All migrations should be committed to version control and applied during deployment using `python backend/manage.py migrate`.
