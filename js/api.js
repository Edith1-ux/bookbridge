/**
 * ==========================================================================
 * BOOKBRIDGE UNIFIED API LAYER
 * Connects to the Express production backend with real-time token auth & fallback
 * ==========================================================================
 */

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
  localStorage.removeItem('admin_mode');
}

function _authHeaders(extra = {}) {
  const token = _getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra,
  };
}

const REQUEST_TIMEOUT_MS = 90000; // 90 seconds to allow Render free tier cold-start wakeups

async function _fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('The server is taking longer than usual to wake up. Please wait a moment and try again.');
      timeoutErr.name = 'TimeoutError';
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  }
}

function _extractErrorMessage(err, status) {
  if (!err || typeof err !== 'object') {
    if (status === 401) return 'Incorrect email or password. Please check your credentials.';
    if (status === 404) return 'Requested account or resource not found.';
    if (status === 408) return 'Request timed out while waiting for server startup.';
    return `Request failed with status ${status}`;
  }
  if (err.error && typeof err.error === 'string') return err.error;
  if (err.detail && typeof err.detail === 'string') return err.detail;
  if (err.message && typeof err.message === 'string') return err.message;

  const firstKey = Object.keys(err)[0];
  if (firstKey) {
    const val = err[firstKey];
    if (Array.isArray(val) && val.length > 0) return `${val[0]}`;
    if (typeof val === 'string') return val;
  }
  return status >= 500 ? 'Server error occurred. Please try again.' : `Request failed (${status})`;
}

// ── Generic fetch helpers ──────────────────────────────────────────────────

async function _get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}${path}${qs ? '?' + qs : ''}`;
  const res = await _fetchWithTimeout(url, { headers: _authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = _extractErrorMessage(err, res.status);
    throw Object.assign(new Error(message), { data: err, status: res.status });
  }
  return res.json();
}

async function _post(path, body = {}) {
  const url = `${API_BASE}${path}`;
  const res = await _fetchWithTimeout(url, {
    method: 'POST',
    headers: _authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = _extractErrorMessage(err, res.status);
    throw Object.assign(new Error(message), { data: err, status: res.status });
  }
  return res.json();
}

async function _put(path, body = {}) {
  const url = `${API_BASE}${path}`;
  const res = await _fetchWithTimeout(url, {
    method: 'PUT',
    headers: _authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = _extractErrorMessage(err, res.status);
    throw Object.assign(new Error(message), { data: err, status: res.status });
  }
  return res.json();
}

async function _delete(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { method: 'DELETE', headers: _authHeaders() });
  if (!res.ok) throw new Error(`DELETE ${url} returned ${res.status}`);
  return res.json().catch(() => null);
}

// ── Normalise helper ───────────────────────────────────────────────────────

function _normaliseBook(b) {
  if (!b) return b;
  return {
    ...b,
    cover: b.cover || b.cover_url || b.coverUrl || b.image || null,
    image: b.image || b.coverUrl || b.cover || null,
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
      console.warn('[BookAPI] Backend offline → local demo fallback', e.message);
      return window.BookDB ? window.BookDB.getBooks(filters) : [];
    }
  },

  async getBookById(id) {
    try {
      const book = await _get(`/books/${id}`);
      return _normaliseBook(book);
    } catch (e) {
      if (window.BookDB) {
        const local = await window.BookDB.getBookById(id);
        if (local) return _normaliseBook(local);
      }
      return null;
    }
  },

  async addBook(bookData) {
    try {
      const saved = await _post('/books', bookData);
      return _normaliseBook(saved);
    } catch (e) {
      if (e.status) throw e; // Server rejected validation
      console.warn('[BookAPI] Network error → local demo mode', e.message);
      return window.BookDB ? window.BookDB.addBook(bookData) : null;
    }
  },

  async updateBook(id, bookData) {
    return await _put(`/books/${id}`, bookData);
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
    try {
      const data = await _post('/register', {
        name: userData.name || userData.full_name,
        email: userData.email,
        password: userData.password,
        enrollment: userData.enrollment || '',
        branch: userData.branch || 'CE',
        semester: userData.semester || 1,
        division: userData.division || 'Div A',
        academicYear: userData.academicYear || '2025-2026',
        whatsapp: userData.whatsapp || '',
        role: userData.role || 'student'
      });

      if (data.token) _setTokens(data.token, null);
      const serverUser = _normaliseUser(data.user);
      if (serverUser) localStorage.setItem('rcti_gtu_current_user', JSON.stringify(serverUser));
      return serverUser;
    } catch (e) {
      // If server returned a business error (409 duplicate, 400 validation), throw it directly
      if (e.status) throw e;

      // Only if network failed entirely, allow offline demo
      console.warn('[BookAPI] Network unreachable → local demo fallback', e.message);
      if (window.BookDB) {
        return await window.BookDB.registerUser(userData);
      }
      throw e;
    }
  },

  async login(email, password) {
    try {
      const data = await _post('/login', { email, password });
      if (data && data.user) {
        if (data.token) _setTokens(data.token, null);
        const user = _normaliseUser(data.user);
        if (user) {
          localStorage.setItem('rcti_gtu_current_user', JSON.stringify(user));
          if (user.role === 'admin') {
            localStorage.setItem('admin_mode', 'true');
          }
        }
        return user;
      }
    } catch (e) {
      // If server is reachable and rejected credentials (401, 403, 400), NEVER bypass
      if (e.status) throw e;

      // Only if server is unreachable, check local offline demo credentials
      console.warn('[BookAPI] Server unreachable → checking local demo credentials');
      if (window.BookDB) {
        const localUser = await window.BookDB.loginUser(email, password);
        if (localUser) return _normaliseUser(localUser);
      }
      throw new Error('Could not connect to authentication server. Please check your network.');
    }
  },

  async getCurrentUser() {
    try {
      const user = await _get('/auth/me');
      if (user) {
        localStorage.setItem('rcti_gtu_current_user', JSON.stringify(_normaliseUser(user)));
        return _normaliseUser(user);
      }
    } catch (e) {
      const stored = localStorage.getItem('rcti_gtu_current_user');
      if (stored) {
        try { return JSON.parse(stored); } catch (err) {}
      }
    }
    return window.BookDB ? window.BookDB.getCurrentUser() : null;
  },

  async updateProfile(profileData) {
    const res = await _put('/users/profile', profileData);
    if (res && res.user) {
      localStorage.setItem('rcti_gtu_current_user', JSON.stringify(_normaliseUser(res.user)));
    }
    return res;
  },

  async forgotPassword(email) {
    try {
      return await _post('/forgot-password', { email });
    } catch (e) {
      return await _post('/auth/forgot-password', { email });
    }
  },

  async verifyResetToken(token) {
    try {
      return await _get(`/auth/verify-reset-token/${encodeURIComponent(token)}`);
    } catch (e) {
      return { valid: true };
    }
  },

  async resetPassword(token, newPassword, confirmPassword, uid = '', email = '') {
    const payload = {
      token,
      reset_token: token,
      new_password: newPassword,
      password: newPassword,
      confirmPassword,
      uid,
      reset_uid: uid,
      email
    };
    try {
      return await _post('/reset-password', payload);
    } catch (e) {
      return await _post('/auth/reset-password', payload);
    }
  },

  async logout() {
    _clearTokens();
    if (window.BookDB) await window.BookDB.logoutUser();
  },

  // ── PUBLIC STATS ───────────────────────────────────────────────────────

  async getPublicStats() {
    try {
      const data = await _get('/statistics');
      return {
        students: data.active_students || data.students || 0,
        books: data.books_listed || data.books || 0,
        exchanges: data.successful_exchanges || data.exchanges || 0,
        donated: data.books_donated || data.donated || 0,
      };
    } catch (e) {
      return null;
    }
  },

  // ── ADMIN CONTROLS ─────────────────────────────────────────────────────

  async getAdminStats() {
    try {
      return await _get('/admin/stats');
    } catch (e) {
      return window.BookDB ? window.BookDB.getAdminStats() : null;
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

  async updateUserRole(userId, role) {
    return await _put(`/admin/users/${userId}/role`, { role });
  },

  async toggleUserStatus(userId, isActive) {
    return await _put(`/admin/users/${userId}/status`, { isActive });
  },

  // ── REAL-TIME CHAT & MESSAGES ──────────────────────────────────────────

  async getConversations() {
    try {
      return await _get('/conversations');
    } catch (e) {
      return window.BookDB ? window.BookDB.getUserConversations() : [];
    }
  },

  async getOrCreateConversation(recipientId, recipientEmail, bookId) {
    return await _post('/conversations', { recipientId, recipientEmail, bookId });
  },

  async getConversationMessages(conversationId) {
    return await _get(`/conversations/${conversationId}/messages`);
  },

  async sendConversationMessage(conversationId, text) {
    return await _post(`/conversations/${conversationId}/messages`, { text });
  },

  // Legacy messaging helpers
  async sendMessage(receiverEmail, text, bookTitle, extra = {}) {
    try {
      return await _post('/messages', { receiverEmail, text, bookTitle, ...extra });
    } catch (e) {
      return window.BookDB ? window.BookDB.sendMessage(receiverEmail, text, bookTitle, extra) : null;
    }
  },

  async getMessages(targetEmail) {
    try {
      const msgs = await _get('/messages', targetEmail ? { with: targetEmail } : {});
      return Array.isArray(msgs) ? msgs : [];
    } catch (e) {
      return window.BookDB ? window.BookDB.getMessages(targetEmail) : [];
    }
  },

  // ── WISHLIST ───────────────────────────────────────────────────────────

  async toggleWishlist(bookId) {
    return window.BookDB ? window.BookDB.toggleWishlist(bookId) : false;
  },

  async getWishlistIds() {
    return window.BookDB ? window.BookDB.getWishlistIds() : [];
  },

  async getWishlistBooks() {
    return window.BookDB ? window.BookDB.getWishlistBooks() : [];
  }
};
