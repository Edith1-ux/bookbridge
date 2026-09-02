/**
 * ==========================================================================
 * BOOKBRIDGE UNIFIED PRODUCTION API LAYER
 * Single source of truth: Django REST Framework API at /api (same-origin)
 * ==========================================================================
 */

const API_BASE = (typeof window !== 'undefined' && (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8000' && window.location.port !== '80' && window.location.port !== '443')))
  ? 'http://127.0.0.1:8000/api'
  : '/api';
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

const REQUEST_TIMEOUT_MS = 15000;
let _isRefreshingToken = false;
let _tokenRefreshPromise = null;

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
      const timeoutErr = new Error('Request timed out. The server took too long to respond. Please check your connection and try again.');
      timeoutErr.name = 'TimeoutError';
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    const netErr = new Error('Network error: Unable to reach the BookBridge server. Please check your connection.');
    netErr.name = 'NetworkError';
    throw netErr;
  }
}

async function _handleTokenRefresh() {
  if (_isRefreshingToken && _tokenRefreshPromise) {
    return _tokenRefreshPromise;
  }
  const refresh = localStorage.getItem('bb_refresh_token');
  if (!refresh) return null;

  _isRefreshingToken = true;
  _tokenRefreshPromise = (async () => {
    try {
      const url = `${API_BASE}/token/refresh/`;
      const res = await _fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      }, 10000);

      if (res.ok) {
        const data = await res.json();
        const newAccess = data.access || data.token;
        if (newAccess) {
          localStorage.setItem('bb_access_token', newAccess);
          return newAccess;
        }
      }
      // Refresh failed or revoked
      _clearTokens();
      _currentUserCache = null;
      return null;
    } catch (_) {
      return null;
    } finally {
      _isRefreshingToken = false;
      _tokenRefreshPromise = null;
    }
  })();

  return _tokenRefreshPromise;
}

function _extractErrorMessage(errData, status) {
  if (!errData || typeof errData !== 'object') {
    if (status === 401) return 'Session expired. Please sign in again.';
    if (status === 403) return 'Access denied. You do not have permission to perform this action.';
    if (status === 404) return 'Requested resource not found.';
    if (status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (status >= 500) return 'Server temporarily unavailable. Please try again shortly.';
    return `Request failed with status ${status}`;
  }
  if (errData.error && typeof errData.error === 'string') return errData.error;
  if (errData.detail && typeof errData.detail === 'string') return errData.detail;
  if (errData.message && typeof errData.message === 'string') return errData.message;

  const firstKey = Object.keys(errData)[0];
  if (firstKey) {
    const val = errData[firstKey];
    if (Array.isArray(val) && val.length > 0) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }
  return status >= 500 ? 'Server error occurred. Please try again.' : `Request failed (${status})`;
}

// ── Generic fetch helpers with clean error reporting & retry ───────────────────

async function _request(method, path, body = null, params = {}, retryOn401 = true) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}${path}${qs ? '?' + qs : ''}`;
  const options = {
    method,
    headers: _authHeaders(),
  };
  if (body !== null && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(body);
  }

  const res = await _fetchWithTimeout(url, options);

  // Auto-refresh token on 401 (once) for non-auth endpoints
  if (res.status === 401 && retryOn401 && !path.includes('/login') && !path.includes('/register') && !path.includes('/token/refresh')) {
    const newToken = await _handleTokenRefresh();
    if (newToken) {
      options.headers = _authHeaders();
      const retryRes = await _fetchWithTimeout(url, options);
      if (retryRes.ok) {
        if (retryRes.status === 204) return { success: true };
        return await retryRes.json().catch(() => ({ success: true }));
      }
      const errData = await retryRes.json().catch(() => ({}));
      const err = new Error(_extractErrorMessage(errData, retryRes.status));
      err.status = retryRes.status;
      err.data = errData;
      throw err;
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = _extractErrorMessage(errData, res.status);
    const err = new Error(message);
    err.status = res.status;
    err.data = errData;
    throw err;
  }

  if (res.status === 204) return { success: true };
  return await res.json().catch(() => ({ success: true }));
}

const _inFlightGetRequests = new Map();

async function _get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const cacheKey = `${path}${qs ? '?' + qs : ''}`;

  if (_inFlightGetRequests.has(cacheKey)) {
    return _inFlightGetRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      return await _request('GET', path, null, params);
    } finally {
      _inFlightGetRequests.delete(cacheKey);
    }
  })();

  _inFlightGetRequests.set(cacheKey, promise);
  return promise;
}

async function _post(path, body = {}) {
  return await _request('POST', path, body);
}

async function _put(path, body = {}) {
  return await _request('PUT', path, body);
}

async function _patch(path, body = {}) {
  return await _request('PATCH', path, body);
}

async function _delete(path) {
  return await _request('DELETE', path);
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

  // ── AUTHENTICATION ───────────────────────────────────────────────────────

  async login(email, password) {
    try {
      const data = await _post('/login/', { email, password });
      if (data.token) {
        _setTokens(data.token, data.refresh);
      } else if (data.access) {
        _setTokens(data.access, data.refresh);
      }
      const user = _normaliseUser(data.user);
      _currentUserCache = user;
      localStorage.setItem('rcti_gtu_current_user', JSON.stringify(user));
      return user;
    } catch (err) {
      throw err;
    }
  },

  async register(userData) {
    try {
      const data = await _post('/register/', userData);
      if (data.token) {
        _setTokens(data.token, data.refresh);
      } else if (data.access) {
        _setTokens(data.access, data.refresh);
      }
      const user = _normaliseUser(data.user);
      _currentUserCache = user;
      localStorage.setItem('rcti_gtu_current_user', JSON.stringify(user));
      return user;
    } catch (err) {
      throw err;
    }
  },

  async getCurrentUser() {
    if (_currentUserCache) return _currentUserCache;
    const token = _getToken();
    if (!token) {
      const stored = localStorage.getItem('rcti_gtu_current_user');
      if (stored) {
        try {
          return _normaliseUser(JSON.parse(stored));
        } catch (_) {}
      }
      return null;
    }
    try {
      const u = await _get('/profile/');
      const user = _normaliseUser(u);
      _currentUserCache = user;
      localStorage.setItem('rcti_gtu_current_user', JSON.stringify(user));
      return user;
    } catch (err) {
      if (err.status === 401) {
        _clearTokens();
        _currentUserCache = null;
      }
      return null;
    }
  },

  async logout() {
    const refresh = localStorage.getItem('bb_refresh_token');
    if (refresh) {
      try {
        await _post('/logout/', { refresh });
      } catch (_) {}
    }
    _clearTokens();
    _currentUserCache = null;
    return true;
  },

  async refreshToken() {
    const refresh = localStorage.getItem('bb_refresh_token');
    if (!refresh) return null;
    try {
      const data = await _post('/token/refresh/', { refresh });
      if (data.access) {
        localStorage.setItem('bb_access_token', data.access);
        return data.access;
      }
    } catch (e) {
      _clearTokens();
    }
    return null;
  },

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
      localStorage.setItem('rcti_gtu_current_user', JSON.stringify(user));
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
        localStorage.setItem('rcti_gtu_current_user', JSON.stringify(user));
        return user;
      } catch (e) {
        _clearTokens();
      }
    }
    return null;
  },

  async logout() {
    const refreshToken = localStorage.getItem('bb_refresh_token');
    if (refreshToken) {
      try {
        await _post('/logout/', { refresh: refreshToken }).catch(() => {});
      } catch (e) {
        // Continue clearing client tokens even if network fails
      }
    }
    _currentUserCache = null;
    _clearTokens();
    localStorage.removeItem('admin_mode');
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

  // ── ADMIN SUITE & MANAGEMENT ───────────────────────────────────────────

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

  async getAdminAnalytics() {
    return await _get('/admin/analytics/');
  },

  async getAdminSystemHealth() {
    return await _get('/admin/system-health/');
  },

  async getAllUsers(filters = {}) {
    try {
      const data = await _get('/admin/users/', filters);
      const list = Array.isArray(data) ? data : (data.results || []);
      return list.map(_normaliseUser);
    } catch (e) {
      if (isDemoMode() && window.BookDB) {
        return window.BookDB.getAllUsers();
      }
      throw e;
    }
  },

  async getAdminUsers(filters = {}) {
    return this.getAllUsers(filters);
  },

  async getAdminUserDetail(id) {
    const data = await _get(`/admin/users/${id}/`);
    return _normaliseUser(data);
  },

  async updateAdminUser(id, payload) {
    const data = await _patch(`/admin/users/${id}/`, payload);
    return _normaliseUser(data);
  },

  async toggleUserStatus(id, isActive) {
    return await this.updateAdminUser(id, { is_active: isActive });
  },

  async updateUserRole(id, newRole) {
    return await this.updateAdminUser(id, { role: newRole });
  },

  async deleteAdminUser(id) {
    return await _delete(`/admin/users/${id}/`);
  },

  async getAdminBooks(filters = {}) {
    return this.getBooks({ all: true, ...filters });
  },

  async updateAdminBook(id, payload) {
    return await _patch(`/books/${id}/`, payload);
  },

  async deleteAdminBook(id) {
    return this.deleteBook(id);
  },

  async getAdminExchanges(filters = {}) {
    try {
      const data = await _get('/exchanges/', filters);
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  async getAdminDonations(filters = {}) {
    try {
      const data = await _get('/donations/', filters);
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  // ── ACADEMIC STRUCTURE (Colleges / Depts / Courses) ─────────────────────

  async getColleges(filters = {}) {
    try {
      const data = await _get('/v1/colleges/', filters);
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  async createCollege(data) {
    return await _post('/v1/colleges/', data);
  },

  async updateCollege(id, data) {
    return await _patch(`/v1/colleges/${id}/`, data);
  },

  async deleteCollege(id) {
    return await _delete(`/v1/colleges/${id}/`);
  },

  async getDepartments(filters = {}) {
    try {
      const data = await _get('/v1/colleges/departments/', filters);
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  async createDepartment(data) {
    return await _post('/v1/colleges/departments/', data);
  },

  async updateDepartment(id, data) {
    return await _patch(`/v1/colleges/departments/${id}/`, data);
  },

  async deleteDepartment(id) {
    return await _delete(`/v1/colleges/departments/${id}/`);
  },

  async getCourses(filters = {}) {
    try {
      const data = await _get('/v1/colleges/courses/', filters);
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  async createCourse(data) {
    return await _post('/v1/colleges/courses/', data);
  },

  async updateCourse(id, data) {
    return await _patch(`/v1/colleges/courses/${id}/`, data);
  },

  async deleteCourse(id) {
    return await _delete(`/v1/colleges/courses/${id}/`);
  },

  // ── AUDIT LOGS, NOTIFICATIONS & EXPORT ──────────────────────────────────

  async getAuditLogs(filters = {}) {
    try {
      const data = await _get('/admin/logs/', filters);
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      return [];
    }
  },

  async broadcastNotification(payload) {
    return await _post('/admin/broadcast/', payload);
  },

  async exportReportCsv(reportType = 'users') {
    const token = _getToken();
    const url = `${API_BASE}/admin/export/?type=${encodeURIComponent(reportType)}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Export failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `bookbridge_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);
    return true;
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
