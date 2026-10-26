# BookBridge Enterprise AI Chatbot Backend — Deployment & Operations Guide

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Generate Prisma client
npx prisma generate

# 4. Start Development Server
npm run dev
```

The API server will run at `http://localhost:8000/api/v1` with Socket.io enabled.

---

## 🐳 Production Docker Deployment

```bash
# Build and spin up all containers (Node App, PostgreSQL 16, Redis 7, Nginx)
docker-compose up -d --build

# View container status
docker-compose ps

# View real-time logs
docker-compose logs -f app
```

---

## 📡 REST API Documentation Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/chat` | AI Chatbot processing endpoint (Intent detection, DB query, QR/PDF output) |
| `POST` | `/api/v1/ask` | Alternate prompt ask endpoint |
| `POST` | `/api/v1/search` | Full-text book search endpoint |
| `POST` | `/api/v1/recommend` | AI Course textbook recommendation endpoint |
| `POST` | `/api/v1/generateQR` | Dynamic Base64 QR Code generation endpoint |
| `POST` | `/api/v1/generatePDF` | PDFKit Document & Report generation endpoint |
| `GET` | `/api/v1/books` | Get all books with pagination & filters |
| `POST` | `/api/v1/books` | Create new textbook listing (Requires JWT) |
| `PUT` | `/api/v1/books/:id` | Update textbook listing (Requires JWT) |
| `DELETE`| `/api/v1/books/:id` | Delete textbook listing (Requires JWT) |
| `POST` | `/api/v1/auth/register` | Student / Faculty / Admin Registration |
| `POST` | `/api/v1/auth/login` | JWT Authentication Login |
| `GET` | `/api/v1/analytics` | Admin system analytics & metrics |
| `GET` | `/api/v1/admin/export/csv` | Export analytics CSV report |
| `GET` | `/api/v1/admin/export/pdf` | Export analytics PDF document |

---

## ⚡ Socket.io Real-Time Event Handlers

- `join_room` `(conversationId)`
- `user_online` `(userId)`
- `typing_start` `{ room, userName }`
- `typing_stop` `{ room, userName }`
- `send_message` `{ conversationId, userId, message }` -> Broadcasts message and streams AI reply back in real-time.
