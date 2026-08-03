# 🌉 Book Bridge - Buy, Sell, Exchange & Donate Books Platform

A modern full-stack community platform designed to bridge readers and pre-loved books through **Buying**, **Selling**, **Exchanging**, and **Donating** books with advanced search, filtering, and database integration.

---

## 🌟 Features Overview

- 🛒 **Buy & Sell**: Browse items listed for sale, add items to cart, checkout with instant order confirmation.
- 🔄 **Exchange Marketplace**: Propose trade swaps by offering books from your collection for listed titles.
- 🎁 **Donate Community Shelf**: Discover free book giveaways and claim books at zero cost.
- 🔍 **Real-Time Search & Filtering**:
  - Instant live keyword search across titles, authors, ISBNs, and descriptions.
  - Multi-category chips (Tech, Sci-Fi, Fiction, Non-Fiction, Academic, Thriller, Kids).
  - Mode selectors (All, Buy/Sell, Exchange, Donate).
  - Book Condition filtering (New, Like New, Good, Fair).
  - Interactive Price Range slider.
  - Sorting (Newest, Price Low/High, Seller Rating).
- 💾 **Dual Database Architecture**:
  - **Embedded Client Database (`js/database.js`)**: Built on IndexedDB + LocalStorage sync for zero-dependency execution in any browser. Pre-populated with 10+ rich seed books.
  - **Node.js Express REST API (`server.js`)**: Full backend implementation providing REST endpoints (`/api/books`, `/api/buy`, `/api/exchange`, `/api/donate/claim`, `/api/stats`) and file storage persistence (`data/db.json`).
- 🎨 **Premium UI/UX Design System**:
  - Dark Mode and Light Mode theme toggle.
  - Glassmorphic navigation and card containers.
  - Distinct action color coding (Emerald = Buy, Indigo = Sell, Amber = Exchange, Rose = Donate).
  - Micro-animations, responsive layout, and toast notification alerts.

---

## 🚀 How to Run

### Option 1: Direct Browser Run (Instant Zero-Setup)
1. Double click or open `index.html` in any web browser (Chrome, Edge, Firefox, Safari).
2. The application will initialize the embedded client database (`window.BookDB`) with rich seed data automatically.

### Option 2: Node.js Express REST Backend Server
If Node.js is installed on your machine:
```bash
# 1. Install dependencies
npm install

# 2. Start Express server
npm start
```
3. Open your browser to `http://localhost:3000`.

### Option 3: MySQL Database Setup
To set up and connect a production MySQL database:
1. Ensure MySQL Server is running on your machine or host.
2. Create the database and import the schema with seed data:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS bookbridge;"
mysql -u root -p bookbridge < data/schema_mysql.sql
```
3. Copy `.env.example` to `.env` and set your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=bookbridge
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/bookbridge"
```
4. Generate Prisma client (optional ORM):
```bash
npx prisma generate
```

---

## 📁 File Structure

```
book bridge/
├── index.html            # Main UI HTML template & modals layout
├── css/
│   └── styles.css        # Design system, glassmorphism, badges, animations, themes
├── js/
│   ├── database.js       # IndexedDB / LocalStorage Client Database & Seed Data
│   ├── api.js            # API layer bridging Express backend & local database fallback
│   └── app.js            # UI controller, search/filter engine, modal workflow handlers
├── server.js             # Node.js Express REST API server
├── package.json          # Node server package configuration
├── data/
│   └── db.json           # File-backed backend database
└── README.md             # Documentation
```
