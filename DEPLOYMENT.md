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

## 🚀 Deploying to Render (Render.com) with MySQL

Render provides Python web hosting, while the persistent MySQL database is hosted on a cloud MySQL provider (such as TiDB Cloud Serverless or Aiven, both offer free tiers).

### Step 1: Provision a Free Cloud MySQL Database (e.g., TiDB Cloud)
1. Go to [TiDB Cloud](https://tidbcloud.com/) (or [Aiven](https://aiven.io/)) and create a free account.
2. Create a free **Serverless Cluster**.
3. Under cluster settings, note your connection details:
   - **Host**: e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`
   - **Port**: `4000` (or `3306` for Aiven/standard MySQL)
   - **Database**: `bookbridge_db` (or create one using the SQL console: `CREATE DATABASE bookbridge_db;`)
   - **User**: your full username including cluster prefix (e.g. `2t3ToPWdqgY8uQT.root`)
   - **Password**: your generated password

### Step 2: Deploy to Render
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/):
   - Click **New +** → **Blueprint** and select your repository.
3. Render automatically reads [`render.yaml`](render.yaml):
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `python manage.py check_db && python manage.py migrate --fake-initial --noinput && python manage.py seed_db && python -m daphne -b 0.0.0.0 -p $PORT asgi:application`
4. In the **Environment Variables** prompt on Render (or under Service → Environment):
   * `MYSQL_HOST`: (your cloud MySQL host)
   * `MYSQL_PORT`: `4000` (or `3306`)
   * `MYSQL_DATABASE`: `bookbridge_db`
   * `MYSQL_USER`: (your cloud MySQL username)
   * `MYSQL_PASSWORD`: (your cloud MySQL password)
   * `MYSQL_SSL`: `true`
   *(Or alternatively, simply paste your full connection string into `DATABASE_URL`)*
5. Click **Apply**. Render will deploy the web service, run `check_db` to verify connectivity, apply migrations, seed the initial academic catalog, and start Daphne ASGI.

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
