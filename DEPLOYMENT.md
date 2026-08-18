# 📚 BookBridge — Deployment & Operations Guide

## 🚀 Quick Start (Local Development)

```bash
# 1. Install Python backend requirements
pip install -r backend/requirements.txt

# 2. Run migrations
python backend/manage.py migrate

# 3. Seed initial GTU textbooks and default accounts
python backend/manage.py seed_db

# 4. Start Django server on port 8000
python backend/manage.py runserver 0.0.0.0:8000
```

Open `http://localhost:8000/browse` in your browser.

---

## 🌐 Deploying to Render (Render.com)

BookBridge includes a pre-configured [`render.yaml`](file:///c:/Users/pved9/OneDrive/Documents/GitHub/book-bridge-2/render.yaml) service specification.

### Automatic Blueprint Deployment:
1. Push this repository to GitHub.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Select your repository. Render will automatically detect `render.yaml` and configure:
   - **Build Command**: `pip install -r backend/requirements.txt && python backend/manage.py migrate && python backend/manage.py seed_db`
   - **Start Command**: `gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:$PORT`
5. Click **Apply**.

---

## 🐳 Docker Deployment

```bash
# Build and run container locally
docker-compose up -d --build

# View container logs
docker logs -f bookbridge_app
```

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | No | User Registration |
| `POST` | `/api/login` | No | JWT Login (returns `token`, `user`) |
| `GET` | `/api/books` | No | List books with filters |
| `POST` | `/api/books` | Yes (JWT) | Add a new book listing |
| `DELETE`| `/api/books/:id` | Yes (JWT) | Delete a book listing |
| `GET` | `/api/statistics` | No | Live platform metrics (Students, Books, Exchanges, Donated) |
| `POST` | `/api/exchanges` | Yes (JWT) | Propose book exchange swap |
| `POST` | `/api/donations` | Yes (JWT) | Claim free donation book |
| `GET` | `/api/admin/stats` | Yes (Admin) | Admin portal metrics |
| `GET` | `/api/admin/users` | Yes (Admin) | List all registered users |
