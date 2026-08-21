# 📚 BookBridge — Student Academic Book Marketplace

> **Bridge Books. Build Minds.** — India's student book-sharing platform for buying, selling, exchanging, and donating academic books and lab manuals across colleges.

---

## 🌟 Platform Capabilities

- 🛒 **Buy & Sell**: List used textbooks with original price discounts, campus pickup locations, and student seller verification.
- 🔄 **Exchange Marketplace**: Propose direct book-for-book swaps across semesters and departments.
- 🎁 **Donate Community Shelf**: Discover and claim zero-cost academic textbooks and lab manuals.
- 🔍 **Real-Time Search & Filtering**: Multi-department filtering (`CE`, `IT`, `EE`, `ME`, `Civil`), price range sliders, condition filters, and GTU code indexing.
- ⚡ **Django REST API Single Source of Truth**: Production-ready Python Django backend powering all endpoints, authentication, throttling, permissions, and database transactions.
- 🎨 **Design System**: Responsive glassmorphic UI, dark and light theme toggle, micro-animations, accessible dialogs, and toast notifications.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Python 3.11+ / Django 5.0+ / Django REST Framework (DRF) |
| **Database** | MySQL 8.0+ (Local and Production) |
| **Authentication** | JWT (`djangorestframework-simplejwt`) + Scoped Rate Limiting |
| **Frontend** | Vanilla HTML5, Modern CSS3 Design Tokens, Vanilla JavaScript ES6+ |
| **Static Delivery** | WhiteNoise with compressed manifest asset caching |
| **WSGI Server** | Gunicorn (3 workers) |
| **Deployment** | Render.com Blueprint (`render.yaml`), Docker container (`docker-compose.yml`) |

> [!IMPORTANT]
> **Use MySQL in local and production environments. Do not use SQLite in production.**
> Do not use Node.js, Express, MongoDB, SQLite, localStorage, IndexedDB, or JSON files as the production backend/database.
> If local browser storage is used, it only stores non-sensitive UI preferences (such as theme or temporary form drafts)—never users, passwords, listings, messages, transactions, or authentication data.

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Python 3.11+**
- **MySQL 8.0+ Server** running locally or via Docker
- **Git**

### 2. Clone and Setup Environment
```bash
# Clone the repository
git clone https://github.com/Edith1-ux/book-bridge-2.git
cd book-bridge-2

# Create and activate virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Configure MySQL Environment Variables
Create your MySQL database:
```sql
CREATE DATABASE bookbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copy the environment template:
```bash
cp .env.example .env
```
Configure your MySQL credentials in `.env`:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=bookbridge_db
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
```

### 4. Run Migrations & Seed Database
```bash
# Apply database migrations
python backend/manage.py migrate

# Seed sample academic books & default accounts
python backend/manage.py seed_db
```

### 5. Start Development Server
```bash
python backend/manage.py runserver 0.0.0.0:8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🐳 Docker Compose (Django + MySQL)

You can launch both MySQL and the Django application with one command:
```bash
docker-compose up -d --build
```
This boots MySQL 8.0 on port `3306` and the Django web service on port `8000`.

---

## 🧪 Running Automated Tests

BookBridge includes an automated test suite covering registration, JWT auth, throttling, admin security, book creation permissions, exchange lifecycle, and donation claim validation.

```bash
# Run all automated tests
python backend/manage.py test

# Run Django security/deployment audit
python backend/manage.py check --deploy
```

---

## 📡 REST API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register/` | Public | Register student account (returns JWT) |
| `POST` | `/api/login/` | Public | Authenticate user (rate limited) |
| `GET` | `/api/profile/` | ✅ JWT | Authenticated user profile |
| `GET` | `/api/books/` | Public | List books with branch, semester, search filters |
| `POST` | `/api/books/` | ✅ JWT | Create book listing (seller auto-assigned) |
| `GET` | `/api/books/<id>/` | Public | Get book details |
| `DELETE`| `/api/books/<id>/`| ✅ Owner/Admin | Delete book listing |
| `GET` | `/api/statistics` | Public | Real-time live database statistics |
| `GET` | `/api/admin/stats/`| ✅ Admin | Platform analytics & metrics |
| `GET` | `/api/admin/users/`| ✅ Admin | List registered platform users |
| `POST` | `/api/exchanges/` | ✅ JWT | Propose book exchange swap |
| `PATCH`| `/api/exchanges/<id>/` | ✅ Participant | Update swap status (`accepted`, `completed`) |
| `POST` | `/api/donations/` | ✅ JWT | Claim free donation book |
| `GET` | `/api/messages/` | ✅ JWT | User conversation inbox |
| `POST` | `/api/messages/` | ✅ JWT | Send direct message to seller |
| `POST` | `/api/wishlist/toggle/` | ✅ JWT | Toggle book in wishlist |
| `GET` | `/api/health` | Public | System and database health status |

---

## 🚢 Deployment to Render

1. Connect your repository in [Render Dashboard](https://dashboard.render.com/).
2. Select **New +** → **Blueprint** and point to `render.yaml`.
3. Set your production MySQL connection variables (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`).
4. Render will execute:
   - **Build**: `pip install -r backend/requirements.txt && python backend/manage.py migrate && python backend/manage.py collectstatic --noinput`
   - **Start**: `gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:$PORT`

---

## 📄 License & Credits

Built with ❤️ for student academic sharing. All rights reserved © 2026 BookBridge.
