/**
 * ==========================================================================
 * BOOKBRIDGE UNIFIED PRODUCTION API LAYER
 * Single source of truth: Django REST Framework API at /api (same-origin)
 * ==========================================================================
 */

const API_BASE = '/api';
let _currentUserCache = null;

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

function isDemoMode() {
  return Boolean(window.BOOKBRIDGE_DEMO_MODE);
}

// ── Generic fetch helpers with clean error reporting ───────────────────────

async function _get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}${path}${qs ? '?' + qs : ''}`;
  let res;
  try {
    res = await fetch(url, { headers: _authHeaders() });
  } catch (netErr) {
    throw new Error('Network error: Unable to reach the BookBridge server. Please check your connection.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.error || errData.detail || (Array.isArray(errData) ? errData[0] : null) || `Request failed (${res.status})`;
    const err = new Error(typeof message === 'object' ? JSON.stringify(message) : message);
    err.status = res.status;
    err.data = errData;
    throw err;
  }
  return res.json();
}

async function _post(path, body = {}) {
  const url = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify(body),
    });
  } catch (netErr) {
    throw new Error('Network error: Unable to reach the BookBridge server. Please check your connection.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    let message = errData.error || errData.detail;
    if (!message && typeof errData === 'object') {
      const firstKey = Object.keys(errData)[0];
      if (firstKey) {
        const val = errData[firstKey];
        message = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
      }
    }
    const err = new Error(message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = errData;
    throw err;
  }
  return res.json();
}

async function _patch(path, body = {}) {
  const url = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'PATCH',
      headers: _authHeaders(),
      body: JSON.stringify(body),
    });
  } catch (netErr) {
    throw new Error('Network error: Unable to reach the BookBridge server.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData.error || errData.detail || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = errData;
    throw err;
  }
  return res.json();
}

async function _delete(path) {
  const url = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, { method: 'DELETE', headers: _authHeaders() });
  } catch (netErr) {
    throw new Error('Network error: Unable to reach the BookBridge server.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData.error || errData.detail || `Delete failed (${res.status})`);
    err.status = res.status;
    err.data = errData;
    throw err;
  }
  return res.json().catch(() => ({ success: true }));
}

// ── Normalise data contracts between frontend & backend ─────────────────────

function _normaliseBook(b) {
  if (!b) return b;
  const sellerObj = b.seller_details || b.seller || {};
  const sellerName = b.seller_name || sellerObj.full_name || sellerObj.name || (typeof b.seller === 'string' ? b.seller : 'Anonymous Seller');

  return {
    ...b,
    id: b.id,
    title: b.title || 'Untitled Book',
    author: b.author || 'Unknown Author',
    branch: b.branch || 'CE',
    semester: b.semester !== undefined ? parseInt(b.semester, 10) : 1,
    condition: b.condition || 'Good',
    mode: b.mode || 'sell',
    price: b.price !== undefined ? parseFloat(b.price) : 0,
    original: b.original !== undefined ? parseFloat(b.original) : (b.original_price !== undefined && b.original_price !== null ? parseFloat(b.original_price) : null),
    original_price: b.original_price !== undefined ? b.original_price : b.original,
    cover: b.cover || b.cover_url || (b.cover_image ? (b.cover_image.startsWith('http') ? b.cover_image : `/media/${b.cover_image}`) : null),
    cover_url: b.cover_url || b.cover || null,
    pdf_url: b.pdf_url || (b.pdf_file ? (b.pdf_file.startsWith('http') ? b.pdf_file : `/media/${b.pdf_file}`) : null),
    gtuCode: b.gtu_code || b.gtuCode || '',
    gtu_code: b.gtu_code || b.gtuCode || '',
    exchange_for: b.exchange_for || b.exchangeFor || '',
    exchangeFor: b.exchange_for || b.exchangeFor || '',
    location: b.location || 'Campus Student Center',
    status: b.status || 'Available',
    views: b.views_count || b.views || 0,
    rating: b.rating !== undefined ? parseFloat(b.rating) : 4.8,
    seller: {
      id: sellerObj.id || b.seller_id || b.seller,
      name: sellerName,
      full_name: sellerName,
      avatar_url: sellerObj.avatar_url || null,
      college_name: sellerObj.college_name || '',
      department_name: sellerObj.department_name || '',
      is_verified: Boolean(sellerObj.is_college_verified),
    },
    seller_name: sellerName,
  };
}

function _normaliseUser(u) {
  if (!u) return u;
  const fullName = u.full_name || u.name || u.email || 'User';
  return {
    ...u,
    id: u.id,
    name: fullName,
    full_name: fullName,
    email: u.email,
    role: u.role || 'STUDENT',
    college_name: u.college_name || '',
    department_name: u.department_name || '',
    is_college_verified: Boolean(u.is_college_verified),
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
      if (isDemoMode() && window.BookDB) {
        console.warn('[BookAPI] Demo mode fallback', e.message);
        return window.BookDB.getBooks(filters);
      }
      throw e;
    }
  },

  async getBookById(id) {
    try {
      const data = await _get(`/books/${id}/`);
      return _normaliseBook(data);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        const local = await window.BookDB.getBookById(id);
        if (local) return _normaliseBook(local);
      }
      throw e;
    }
  },

  async addBook(bookData) {
    const payload = {
      title: bookData.title,
      author: bookData.author,
      isbn: bookData.isbn || '',
      gtu_code: bookData.gtu_code || bookData.gtuCode || '',
      branch: bookData.branch || 'CE',
      semester: parseInt(bookData.semester, 10) || 1,
      edition: bookData.edition || 'Latest Edition',
      resource_type: bookData.resource_type || bookData.resourceType || 'textbook',
      genre: bookData.genre || 'Academic',
      subject: bookData.subject || 'Engineering',
      condition: bookData.condition || 'Good',
      language: bookData.language || 'English',
      mode: bookData.mode || 'sell',
      price: parseFloat(bookData.price) || 0,
      original_price: bookData.original_price ? parseFloat(bookData.original_price) : (bookData.original ? parseFloat(bookData.original) : null),
      exchange_for: bookData.exchange_for || bookData.exchangeFor || '',
      description: bookData.description || '',
      location: bookData.location || 'Campus Pickup',
      cover_url: bookData.cover_url || bookData.cover || '',
      pdf_url: bookData.pdf_url || '',
    };

    try {
      const saved = await _post('/books/', payload);
      return _normaliseBook(saved);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        console.warn('[BookAPI] Demo mode addBook fallback', e.message);
        return window.BookDB.addBook(bookData);
      }
      throw e;
    }
  },

  async deleteBook(id) {
    try {
      return await _delete(`/books/${id}/`);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.deleteBook(id);
      }
      throw e;
    }
  },

  // ── AUTH ───────────────────────────────────────────────────────────────

  async register(userData) {
    const fullName = (userData.full_name || userData.name || '').trim();
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const payload = {
      full_name: fullName,
      name: fullName,
      email: cleanEmail,
      password: userData.password,
      college_name: userData.college_name || '',
      enrollment: userData.enrollment || '',
      branch: userData.branch || 'CE',
      semester: userData.semester || 1,
      phone_number: userData.phone_number || userData.phone || userData.whatsapp || '',
    };

    try {
      const data = await _post('/register/', payload);
      if (data.token || data.access) {
        _setTokens(data.access || data.token, data.refresh);
      }
      const user = _normaliseUser(data.user);
      _currentUserCache = user;
      return user;
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        console.warn('[BookAPI] Demo mode register fallback', e.message);
        return window.BookDB.register(userData);
      }
      throw e;
    }
  },

  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    try {
      const data = await _post('/login/', { email: cleanEmail, password: cleanPassword });
      if (data.token || data.access) {
        _setTokens(data.access || data.token, data.refresh);
      }
      const user = _normaliseUser(data.user);
      _currentUserCache = user;
      return user;
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        console.warn('[BookAPI] Demo mode login fallback', e.message);
        return window.BookDB.login(cleanEmail, cleanPassword);
      }
      throw e;
    }
  },

  async getCurrentUser() {
    if (_currentUserCache) return _currentUserCache;
    const token = _getToken();
    if (token) {
      try {
        const profile = await _get('/profile/');
        const user = _normaliseUser(profile);
        _currentUserCache = user;
        return user;
      } catch (e) {
        _clearTokens();
      }
    }
    return null;
  },

  async logout() {
    _currentUserCache = null;
    _clearTokens();
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
        saved: data.saved || 0,
      };
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.getStats ? window.BookDB.getStats() : null;
      }
      return null;
    }
  },

  // ── ADMIN STATS & USERS ────────────────────────────────────────────────

  async getAdminStats() {
    try {
      return await _get('/admin/stats/');
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.getAdminStats();
      }
      throw e;
    }
  },

  async getAllUsers() {
    try {
      const data = await _get('/admin/users/');
      const list = Array.isArray(data) ? data : (data.results || []);
      return list.map(_normaliseUser);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.getAllUsers();
      }
      throw e;
    }
  },

  // ── MESSAGES ───────────────────────────────────────────────────────────

  async sendMessage(receiverEmail, text, bookTitle = '') {
    try {
      return await _post('/messages/', {
        receiver_email: receiverEmail,
        text,
        book_title: bookTitle,
      });
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.sendMessage(receiverEmail, text, bookTitle);
      }
      throw e;
    }
  },

  async getMessages(targetEmail = null) {
    try {
      const params = targetEmail ? { with: targetEmail } : {};
      return await _get('/messages/', params);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.getMessages(targetEmail);
      }
      return [];
    }
  },

  // ── WISHLIST ───────────────────────────────────────────────────────────

  async toggleWishlist(bookId) {
    try {
      const res = await _post('/wishlist/toggle/', { book_id: bookId });
      return res.added;
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.toggleWishlist(bookId);
      }
      throw e;
    }
  },

  async getWishlistBooks() {
    try {
      const data = await _get('/wishlist/');
      const list = Array.isArray(data) ? data : (data.results || []);
      return list.map(item => _normaliseBook(item.book_details || item.book));
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.getWishlistBooks();
      }
      return [];
    }
  },

  async getWishlistIds() {
    try {
      const books = await this.getWishlistBooks();
      return books.map(b => b.id);
    } catch (e) {
      return [];
    }
  },

  // ── EXCHANGE ────────────────────────────────────────────────────────────

  async proposeExchange(swapData) {
    const payload = {
      target_book: swapData.target_book || swapData.targetBookId || swapData.targetBook,
      offered_book: swapData.offered_book || swapData.offeredBookId || null,
      offered_book_title: swapData.offered_book_title || swapData.offeredTitle || '',
      note: swapData.note || '',
    };

    try {
      return await _post('/exchanges/', payload);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.proposeExchange(swapData);
      }
      throw e;
    }
  },

  async getExchangeProposals() {
    try {
      const data = await _get('/exchanges/');
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  async updateExchangeStatus(id, newStatus) {
    return await _patch(`/exchanges/${id}/`, { status: newStatus });
  },

  // ── DONATIONS ───────────────────────────────────────────────────────────

  async claimDonation(bookId, message = '') {
    const payload = {
      book: bookId,
      message: typeof message === 'string' ? message : (message.message || ''),
    };

    try {
      return await _post('/donations/', payload);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.claimDonation(bookId, message);
      }
      throw e;
    }
  },

  async getDonationClaims() {
    try {
      const data = await _get('/donations/');
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  async updateDonationStatus(id, newStatus) {
    return await _patch(`/donations/${id}/`, { status: newStatus });
  },

  // ── PAYMENTS & CHECKOUT ────────────────────────────────────────────────

  async createPaymentIntent(bookId, gateway = 'DIRECT_HANDOVER') {
    return await _post('/payments/intent/', {
      book_id: bookId,
      gateway: gateway,
    });
  },

  // ── AI RECOMMENDATIONS & ASSISTANT ─────────────────────────────────────

  async getAIRecommendations(branch, semester) {
    try {
      const data = await _get('/ai/recommend/', { branch, semester });
      const list = Array.isArray(data) ? data : (data.results || []);
      return list.map(_normaliseBook);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.getAIRecommendations(branch, semester);
      }
      return [];
    }
  },

  async askAIAssistant(prompt, sessionId = 'default') {
    return await _post('/ai/assistant/', { prompt, session_id: sessionId });
  },

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────

  async getNotifications() {
    try {
      return await _get('/v1/notifications/');
    } catch (e) {
      return { count: 0, notifications: [] };
    }
  },

  async markNotificationsRead(id = null) {
    if (id) {
      return await _post(`/v1/notifications/${id}/read/`);
    }
    return await _post('/v1/notifications/read/');
  },
};
