# 📚 BookBridge

> **Bridge Books. Build Minds.** — India's student book-sharing platform.

BookBridge lets students **buy, sell, exchange, and donate** academic books across all college departments.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ — [Download here](https://nodejs.org/)
- **MongoDB** (optional) — falls back to local `data/db.json` if MongoDB is not running

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd book-bridge
npm install
```

### 2. Set Environment Variables
```bash
# Copy the example file
copy .env.example .env

# Open .env and set:
# JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
# MONGO_URI=mongodb://127.0.0.1:27017/bookbridge  (optional)
```

### 3. Run the Server
```bash
npm start           # Production
npm run dev         # Development (with auto-reload via nodemon)
```

Then open **http://localhost:8000** in your browser.

---

## 🏗️ Project Structure

```
book bridge/
├── 📄 HTML Pages
│   ├── index.html          — Home
│   ├── browse.html         — Browse books
│   ├── exchange.html       — Exchange
│   ├── donate.html         — Donate
│   ├── login.html          — Login
│   ├── register.html       — Register
│   ├── admin.html          — Admin panel (auth-protected)
│   ├── dashboard.html      — User dashboard
│   ├── privacy.html        — Privacy Policy
│   ├── terms.html          — Terms of Service
│   └── forgot-password.html— Password recovery
│
├── 🎨 Styling
│   ├── style.css           — Main CSS
│   └── login.css           — Login page CSS
│
├── ⚡ Frontend JS (js/)
│   ├── database.js         — Browser localStorage engine
│   ├── api.js              — API client (calls /api endpoints)
│   ├── app.js              — Page controllers & UI logic
│   └── live-stats.js       — Real-time statistics
│
├── 🔧 Backend (Node.js / Express)
│   ├── server.js           — Main server entry point
│   ├── config/db.js        — MongoDB + JSON fallback
│   ├── controllers/        — authController, bookController
│   ├── middleware/         — JWT auth, CORS, rate limiting, validation
│   └── models/             — Mongoose User & Book schemas
│
├── 💾 Data
│   └── data/db.json        — JSON fallback database
│
├── 🖼️ Assets
│   ├── browse_images/      — Hero + 25 book covers
│   └── logo.png.jpeg       — Logo
│
└── ⚙️ Config / Deploy
    ├── package.json        — npm config (start: node server.js)
    ├── pm2.config.js       — PM2 process manager
    ├── Dockerfile          — Docker container
    ├── nginx.conf          — Nginx reverse proxy
    ├── netlify.toml        — Netlify deploy config
    └── _redirects          — URL routing rules
```

---

## 🔐 Authentication

BookBridge uses **JWT + bcrypt** for secure authentication:
- Passwords are hashed with **bcrypt (12 rounds)** on the server / SHA-256 in localStorage fallback
- Tokens expire in **7 days**
- Admin routes require both a valid JWT and `role: 'admin'`

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | — | Create account |
| POST | `/api/login` | — | Login (returns JWT) |
| GET | `/api/books` | — | List books with filters |
| POST | `/api/books` | ✅ JWT | Add a book listing |
| DELETE | `/api/books/:id` | ✅ JWT | Remove a listing |
| GET | `/api/statistics` | — | Platform stats |
| GET | `/api/admin/stats` | ✅ Admin | Admin analytics |
| GET | `/api/admin/users` | ✅ Admin | All users |
| POST | `/api/messages` | ✅ JWT | Send a message |

---

## 🚢 Deployment

**Netlify (Recommended — free)**
```bash
# Just push to GitHub and connect to Netlify
# netlify.toml and _redirects are already configured
```

**Docker**
```bash
docker-compose up -d
```

**PM2 (VPS)**
```bash
npm install pm2 -g
pm2 start pm2.config.js
```

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | 64+ char random string |
| `PORT` | No | Default: 8000 |
| `MONGO_URI` | No | MongoDB connection (falls back to JSON) |
| `NODE_ENV` | No | `development` or `production` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Vanilla CSS, Vanilla JS |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) + JSON fallback |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO |
| Security | Helmet + CORS + Rate Limiting (express-rate-limit) |

---

Built with ❤️ by RCTI GTU Students
