/**
 * ==========================================================================
 * BOOKBRIDGE UNIFIED API LAYER
 * FIX: Points to the Express backend at /api (same origin), not Django port 8000
 * ==========================================================================
 */

// FIX: Use relative /api path so it works on any host (local, Render, Vercel, etc.)
// Previously this was 'http://localhost:8000/api/v1' which would always fail in production
const API_BASE = '/api';

// ── Token helpers ──────────────────────────────────────────────────────────

function _getToken() {
  return localStorage.getItem('bb_access_token') || null;
}

function _setTokens(access, refresh) {
  if (access) localStorage.setItem('bb_access_token', access);
  if (refresh) localStorage.setItem('bb_refresh_token', refresh);
}

function _clearTokens() {
  localStorage.removeItem('bb_access_token');
  localStorage.removeItem('bb_refresh_token');
  localStorage.removeItem('rcti_gtu_current_user');
}

function _authHeaders(extra = {}) {
  const token = _getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Generic fetch helpers with server-offline fallback ─────────────────────

async function _get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: _authHeaders() });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function _post(path, body = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: _authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.error || err.detail || err.message || `Request failed with status ${res.status}`;
    throw Object.assign(new Error(message), { data: err, status: res.status });
  }
  return res.json();
}

async function _delete(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { method: 'DELETE', headers: _authHeaders() });
  if (!res.ok) throw new Error(`DELETE ${url} → ${res.status}`);
  return res.json().catch(() => null);
}

// ── Normalise a backend Book object to match frontend field names ────────────

function _normaliseBook(b) {
  if (!b) return b;
  return {
    ...b,
    cover: b.cover || b.cover_url || b.image || null,
    image: b.image || b.cover || b.cover_url || null,
    original: b.original !== undefined ? b.original : b.original_price,
    gtuCode: b.gtu_code || b.gtuCode || '',
    seller: b.seller ? { ...b.seller, name: b.seller.name || b.seller.full_name } : null,
  };
}

function _normaliseUser(u) {
  if (!u) return u;
  return {
    ...u,
    name: u.name || u.full_name || u.email,
  };
}

// ── BookBridge API Surface ─────────────────────────────────────────────────

window.BookAPI = {

  // ── BOOKS ──────────────────────────────────────────────────────────────

  async getBooks(filters = {}) {
    try {
      const data = await _get('/books', filters);
      const list = Array.isArray(data) ? data : (data.results || []);
      return list.map(_normaliseBook);
    } catch (e) {
      console.warn('[BookAPI] Backend offline → localStorage fallback', e.message);
      return window.BookDB ? window.BookDB.getBooks(filters) : [];
    }
  },

  async getBookById(id) {
    try {
      // Try local first (faster, avoids extra API round trip)
      if (window.BookDB) {
        const local = await window.BookDB.getBookById(id);
        if (local) return _normaliseBook(local);
      }
    } catch (e) {}
    return null;
  },

  async addBook(bookData) {
    try {
      const saved = await _post('/books', bookData);
      return _normaliseBook(saved);
    } catch (e) {
      console.warn('[BookAPI] addBook fallback', e.message);
      return window.BookDB ? window.BookDB.addBook(bookData) : null;
    }
  },

  async deleteBook(id) {
    try {
      return await _delete(`/books/${id}`);
    } catch (e) {
      return window.BookDB ? window.BookDB.deleteBook(id) : null;
    }
  },

  // ── AUTH ───────────────────────────────────────────────────────────────

  async register(userData) {
    let serverUser = null;
    let serverError = null;

    try {
      const data = await _post('/register', {
        name: userData.name || userData.full_name,
        email: userData.email,
        password: userData.password,
        enrollment: userData.enrollment || '',
        branch: userData.branch || 'CE',
        semester: userData.semester || 1,
        whatsapp: userData.whatsapp || '',
      });

      if (data.token) _setTokens(data.token, null);
      serverUser = _normaliseUser(data.user);
      if (serverUser) localStorage.setItem('rcti_gtu_current_user', JSON.stringify(serverUser));
    } catch (e) {
      serverError = e.data?.error || e.message;
      console.warn('[BookAPI] register server error → checking localStorage fallback', serverError);
    }

    let localUser = null;
    if (window.BookDB) {
      try {
        localUser = await window.BookDB.registerUser(userData);
      } catch (e) {
        if (!serverUser) throw (serverError ? new Error(serverError) : e);
      }
    }

    const finalUser = serverUser || localUser;
    if (finalUser) return finalUser;
    throw new Error(serverError || 'Registration failed. Please try again.');
  },

  async login(email, password) {
    // 1. Try server login
    try {
      const data = await _post('/login', { email, password });
      if (data && data.user) {
        if (data.token) _setTokens(data.token, null);
        const user = _normaliseUser(data.user);
        if (user) localStorage.setItem('rcti_gtu_current_user', JSON.stringify(user));
        return user;
      }
    } catch (e) {
      console.warn('[BookAPI] Server login notice:', e.message, 'Checking local database fallback...');
    }

    // 2. Try local database (offline/demo/local registration)
    if (window.BookDB) {
      const localUser = await window.BookDB.loginUser(email, password);
      if (localUser) {
        return _normaliseUser(localUser);
      }
    }

    throw new Error('Invalid email or password. Please check your credentials.');
  },

  async getCurrentUser() {
    const stored = localStorage.getItem('rcti_gtu_current_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return window.BookDB ? window.BookDB.getCurrentUser() : null;
  },

  async logout() {
    _clearTokens();
    if (window.BookDB) await window.BookDB.logoutUser();
  },

  // ── PUBLIC STATS ───────────────────────────────────────────────────────

  async getPublicStats() {
    try {
      // FIX: Calls the now-existing /api/statistics endpoint
      const data = await _get('/statistics');
      return {
        students: data.active_students || 0,
        books: data.books_listed || 0,
        exchanges: data.successful_exchanges || 0,
        donated: data.books_donated || 0,
      };
    } catch (e) {
      return null;
    }
  },

  // ── ADMIN STATS ────────────────────────────────────────────────────────

  async getAdminStats() {
    try {
      return await _get('/admin/stats');
    } catch (e) {
      return window.BookDB ? window.BookDB.getAdminStats()
        : { totalUsers: 0, totalListings: 0, activeSwaps: 0, freeDonations: 0 };
    }
  },

  async getAllUsers() {
    try {
      const data = await _get('/admin/users');
      const list = Array.isArray(data) ? data : (data.results || []);
      return list.map(_normaliseUser);
    } catch (e) {
      return window.BookDB ? window.BookDB.getAllUsers() : [];
    }
  },

  async deleteUser(id) {
    return window.BookDB ? window.BookDB.deleteUser(id) : null;
  },

  // ── MESSAGES ───────────────────────────────────────────────────────────

  async sendMessage(receiverEmail, text, bookTitle, extra = {}) {
    try {
      return await _post('/messages', { receiverEmail, text, bookTitle, ...extra });
    } catch (e) {
      return window.BookDB ? window.BookDB.sendMessage(receiverEmail, text, bookTitle, extra) : null;
    }
  },

  async getMessages(targetEmail) {
    try {
      const msgs = await _get('/messages');
      if (Array.isArray(msgs)) {
        if (!targetEmail) return msgs;
        return msgs.filter(m => m.senderEmail === targetEmail || m.receiverEmail === targetEmail);
      }
      return msgs;
    } catch (e) {
      return window.BookDB ? window.BookDB.getMessages(targetEmail) : [];
    }
  },

  async getUserConversations() {
    return window.BookDB ? window.BookDB.getUserConversations() : [];
  },

  async markMessagesAsRead(otherUserEmail) {
    return window.BookDB ? window.BookDB.markMessagesAsRead(otherUserEmail) : null;
  },

  // ── WISHLIST (localStorage only for now) ───────────────────────────────

  async toggleWishlist(bookId) {
    return window.BookDB ? window.BookDB.toggleWishlist(bookId) : false;
  },

  async getWishlistIds() {
    return window.BookDB ? window.BookDB.getWishlistIds() : [];
  },

  async getWishlistBooks() {
    return window.BookDB ? window.BookDB.getWishlistBooks() : [];
  },

  // ── EXCHANGE ────────────────────────────────────────────────────────────

  async proposeExchange(swapData) {
    return window.BookDB ? window.BookDB.proposeExchange(swapData) : null;
  },

  // ── DONATIONS ───────────────────────────────────────────────────────────

  async claimDonation(bookId, userDetails) {
    return window.BookDB ? window.BookDB.claimDonation(bookId, userDetails) : null;
  },

  // ── REVIEWS ────────────────────────────────────────────────────────────

  async addReview(sellerEmail, rating, comment) {
    return window.BookDB ? window.BookDB.addReview(sellerEmail, rating, comment) : null;
  },

  async buyBook(bookId, buyerDetails) {
    return window.BookDB ? window.BookDB.buyBook(bookId, buyerDetails) : null;
  },

  // ── AI RECOMMENDATIONS ─────────────────────────────────────────────────

  async getAIRecommendations(branch, semester) {
    return window.BookDB ? window.BookDB.getAIRecommendations(branch, semester) : [];
  },
};
