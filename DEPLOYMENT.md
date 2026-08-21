# 📚 BookBridge — Production Deployment & Operations Guide

This guide details configuring, deploying, and operating BookBridge with MySQL and Gunicorn on Render, Docker, or any cloud Linux host.

> [!IMPORTANT]
> **Use MySQL in local and production environments. Do not use SQLite in production.**
> Do not use Node.js, Express, MongoDB, SQLite, localStorage, IndexedDB, or JSON files as the production backend/database.
> If local browser storage remains, it may only store non-sensitive UI preferences (such as theme or temporary form drafts)—never users, passwords, listings, messages, transactions, or authentication data.

---

## 🔧 Production Environment Checklist

Before launching to production, set the following environment variables:

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `SECRET_KEY` | `django-insecure-prod-...` (Generate unique 64+ char key) | Cryptographic key for JWT & sessions |
| `DEBUG` | `False` | Disables debug mode and detailed error stack traces |
| `ALLOWED_HOSTS` | `yourdomain.com,bookbridge.onrender.com` | Allowed hostnames |
| `MYSQL_HOST` | `your-mysql-host.cloud` | MySQL database server hostname |
| `MYSQL_PORT` | `3306` | MySQL port (default: 3306) |
| `MYSQL_DATABASE` | `bookbridge_db` | MySQL database name |
| `MYSQL_USER` | `bookbridge_user` | MySQL database username |
| `MYSQL_PASSWORD` | `your_secure_mysql_password` | MySQL database password |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com,https://bookbridge.onrender.com` | Whitelisted cross-origin domains |
| `CSRF_TRUSTED_ORIGINS` | `https://yourdomain.com,https://bookbridge.onrender.com` | Trusted CSRF origins |
| `SECURE_SSL_REDIRECT` | `True` | Enforce HTTPS redirects |
| `DEMO_MODE` | `false` | Disables demo fallback mode |

---

## 🚀 Deploying to Render (Render.com)

1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/):
   - Create or link your managed MySQL database instance.
   - Click **New +** → **Blueprint** and select your repository.
3. Render automatically loads [`render.yaml`](file:///c:/Users/pved9/OneDrive/Documents/GitHub/book-bridge-2/render.yaml):
   - **Build Command**: `pip install -r backend/requirements.txt && python backend/manage.py migrate && python backend/manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:$PORT`
4. Provide the MySQL credentials (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`) in the Render environment settings.

---

## 🐳 Docker Deployment

### Building and Running with Docker Compose (Django + MySQL)

```bash
# Launch MySQL 8.0 and Django Web Service
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
  -e MYSQL_HOST="your-mysql-host" \
  -e MYSQL_PORT="3306" \
  -e MYSQL_DATABASE="bookbridge_db" \
  -e MYSQL_USER="bookbridge_user" \
  -e MYSQL_PASSWORD="your_mysql_password" \
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
