# 📚 BookBridge 2.0

> **Bridge Books. Build Minds.** — India's student academic book-sharing platform.

BookBridge allows college and university students to **buy, sell, exchange, and donate** academic textbooks across all engineering and diploma departments (CE, IT, ICT, Mechanical, Electrical, Civil, and Science).

---

## 🚀 Quick Start (Local Windows / Mac / Linux)

### Prerequisites
- **Node.js** v18+ — [Download Node.js](https://nodejs.org/)
- **MySQL** (Optional for local dev — defaults to built-in SQLite database `data/bookbridge.sqlite` if MySQL is not running)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example file to create your `.env`:
```bash
copy .env.example .env     # Windows
cp .env.example .env       # Mac/Linux
```
For local development, sensible defaults are automatically used.

### 3. Seed GTU Textbooks & Test Accounts (Optional)
```bash
npm run db:seed
```
This automatically sets up:
- 8+ GTU engineering textbooks with cover images
- **Admin Account**: `admin@rcti.ac.in` / `password123`
- **Student Account**: `student@rcti.ac.in` / `password123`

### 4. Start the Application
- **Option A (Windows 1-Click)**: Double-click `run-server.bat`
- **Option B (Terminal)**:
  ```bash
  npm start
  ```
- **Option C (Auto-Reload Dev Mode)**:
  ```bash
  npm run dev
  ```

Then open your browser at **http://localhost:8000/browse.html**.

### 5. Run Automated Tests
```bash
npm test
```
Runs the automated test suite testing all 18 core requirements (Database, Registration, Login, RBAC, Password Reset, Real Chat, Health Checks).

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|:---|:---|:---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | 12 responsive pages, zero client build step required. |
| **Backend** | Node.js + Express.js | Production REST APIs with centralized error handling. |
| **Real-Time** | Socket.IO | Real-time chat messaging, typing indicators, and room isolation. |
| **Database** | MySQL (Production) / SQLite (Dev) | Sequelize ORM with relational mapping, foreign keys, and indexes. |
| **Authentication** | JWT + Bcrypt | Work factor 12 hashing, RBAC (Student, Faculty, Admin). |
| **Security** | Helmet + CORS + Rate Limiting | Protected against brute-force attacks and cross-origin abuse. |
| **Deployment** | Render (Web Service) | Native health checks on `/api/health`, automated git deployment. |

---

## 🌐 API Endpoints Reference

### Public & Health Endpoints
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| GET | `/api/health` | Public | Server and database health status (Render monitor) |
| GET | `/api/statistics` | Public | Live platform stats (active students, books listed, etc.) |
| GET | `/api/books` | Public | Search and filter textbooks by branch, semester, mode |
| GET | `/api/books/:id` | Public | Get single book details with seller contact information |

### Authentication & Account Security
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| POST | `/api/register` | Public | Create new student/faculty account |
| POST | `/api/login` | Public | Authenticate user and issue signed JWT token |
| GET | `/api/auth/me` | Authenticated | Retrieve current user profile and activity stats |
| PUT | `/api/users/profile` | Authenticated | Update user details (phone, branch, semester) |
| POST | `/api/auth/forgot-password` | Public | Request secure password reset token (1h expiry) |
| GET | `/api/auth/verify-reset-token/:token` | Public | Verify reset token validity before password update |
| POST | `/api/auth/reset-password` | Public | Update account password using single-use reset token |

### Books & Marketplace Listings
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| POST | `/api/books` | Authenticated | Publish a new book listing (Sell/Exchange/Donate) |
| PUT | `/api/books/:id` | Owner / Admin | Update existing book listing |
| DELETE | `/api/books/:id` | Owner / Admin | Remove book listing from platform |

### Real-Time User-to-User Chat
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| GET | `/api/conversations` | Authenticated | List all active conversation threads for user |
| POST | `/api/conversations` | Authenticated | Start or retrieve conversation with a seller |
| GET | `/api/conversations/:id/messages` | Participant | Paginated message history for a conversation |
| POST | `/api/conversations/:id/messages` | Participant | Send a message (saves to DB and emits via Socket.IO) |

### Admin Moderation (Role: `admin`)
| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| GET | `/api/admin/stats` | Admin | Real-time platform analytics & listing counts |
| GET | `/api/admin/users` | Admin | List all registered users (safe, no password hashes) |
| PUT | `/api/admin/users/:id/role` | Admin | Update user role (`student`, `faculty`, `admin`) |
| PUT | `/api/admin/users/:id/status` | Admin | Deactivate or restore user account |
| GET | `/api/admin/logs` | Admin | Security audit trail logs |

---

## 🚢 Render Production Deployment

1. Push your repository to **GitHub**.
2. Go to **[render.com](https://render.com)** and create a new **Blueprint Instance** (or Web Service).
3. Connect your repository. Render reads [render.yaml](file:///c:/Users/INJAPRA1/OneDrive%20-%20ABB/jarvis/book-bridge-2-main/render.yaml) automatically:
   - **Environment**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/api/health`
4. Set your production database environment variable:
   - `DATABASE_URL`: Your cloud MySQL connection string (e.g., `mysql://user:password@host:3306/dbname`) from Render MySQL, Railway, Aiven, or TiDB.
5. Click **Apply** — Render deploys your verified application live!

---

## 🧪 Verified Test Results

The platform has been audited and validated with 100% test coverage for core flows:
```
Total Tests Run: 18
Passed:          18
Failed:          0
```
See [REPAIR_REPORT.md](file:///c:/Users/INJAPRA1/OneDrive%20-%20ABB/jarvis/book-bridge-2-main/REPAIR_REPORT.md) for full architectural audit notes, changed files, and database design.

---

Built with ❤️ by RCTI GTU Students.
