/**
 * ==========================================================================
 * BOOKBRIDGE APPLICATION CONTROLLER
 * Handles all page logic, components, animations, and UI interactions
 * Connected to Django REST API as single source of truth
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  initGlobalComponents();
  await updateNavUserUI();
  initLanguageSwitcher();
  registerPWA();

  const path = window.location.pathname.toLowerCase();
  if (path.includes('admin')) initAdminPage();
  else if (path.includes('sell')) initSellPage();
  else if (path.includes('browse')) initBrowsePage();
  else if (path.includes('exchange')) initExchangePage();
  else if (path.includes('donate')) initDonatePage();
  else if (path.includes('contact')) initContactPage();
  else if (path.includes('login')) initLoginPage();
  else if (path.includes('register')) initRegisterPage();
  else if (path.includes('dashboard')) initDashboardPage();
  else initHomePage();
});

/* 📱 REGISTER PWA SERVICE WORKER */
function registerPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(() => {})
        .catch(() => {});
    });
  }
}

/* 🌐 i18n MULTI-LANGUAGE SWITCHER (EN / GU / HI) */
const I18N_DICTIONARY = {
  en: {
    home: 'Home', buy: 'Buy Books', sell: 'Sell Books', browse: 'Browse', exchange: 'Exchange', donate: 'Donate', about: 'About', contact: 'Contact',
    welcome: 'Bridge Books. Build Minds.', upload: 'Upload Book', login: 'Login', register: 'Get Started',
    verified: 'Verified Student'
  },
  gu: {
    home: 'હોમ', buy: 'પુસ્તકો ખરીદો', sell: 'પુસ્તકો વેચો', browse: 'બ્રાઉઝ કરો', exchange: 'એક્સચેન્જ', donate: 'દાન કરો', about: 'અમારા વિશે', contact: 'સંપર્ક',
    welcome: 'પુસ્તકો જોડો. મન બનાવો.', upload: 'અપલોડ કરો', login: 'લોગિન', register: 'શરૂ કરો',
    verified: 'પ્રમાણિત વિદ્યાર્થી'
  },
  hi: {
    home: 'होम', buy: 'किताबें खरीदें', sell: 'किताबें बेचें', browse: 'ब्राउज़ करें', exchange: 'एक्सचेंज', donate: 'दान करें', about: 'हमारे बारे में', contact: 'संपर्क',
    welcome: 'किताबें जोड़ें। विचार बनाएं।', upload: 'अपलोड करें', login: 'लॉगिन', register: 'शुरू करें',
    verified: 'सत्यापित छात्र'
  }
};

function initLanguageSwitcher() {
  const currentLang = localStorage.getItem('bb_user_lang') || 'en';
  applyLanguageTranslations(currentLang);

  document.querySelectorAll('.lang-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nextLang = currentLang === 'en' ? 'gu' : currentLang === 'gu' ? 'hi' : 'en';
      localStorage.setItem('bb_user_lang', nextLang);
      applyLanguageTranslations(nextLang);
      showToast(`Language set to ${nextLang.toUpperCase()}`, 'info');
      setTimeout(() => window.location.reload(), 500);
    });
  });
}

function applyLanguageTranslations(lang) {
  const dict = I18N_DICTIONARY[lang] || I18N_DICTIONARY.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
}

/* ==========================================================================
   GLOBAL COMPONENTS
   ========================================================================== */

function initGlobalComponents() {
  setupMobileMenu();
  setupScrollToTop();
  setupNavbarScroll();
  setupScrollAnimations();
  setupAccordions();
  setupModals();
  setupCounterAnimations();
  setupPDFModal();
}

/* 📱 MOBILE MENU */
function setupMobileMenu() {
  const btn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileNavDrawer');
  if (!btn || !drawer) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = drawer.classList.toggle('active');
    btn.innerHTML = isActive ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    btn.setAttribute('aria-expanded', isActive);
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('active');
      btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* 🔝 SCROLL TO TOP */
function setupScrollToTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* 🧊 NAVBAR SCROLL EFFECT */
function setupNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ✨ SCROLL ANIMATIONS */
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* 🔢 COUNTER ANIMATIONS */
function setupCounterAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  if (!target || isNaN(target)) return;
  const duration = 1200;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* 🎵 ACCORDION */
function setupAccordions() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const wasOpen = item.classList.contains('open');

      item.closest('.accordion').querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));

      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* 🪟 MODALS */
function setupModals() {
  const bookModal = document.getElementById('bookDetailsModal');
  const closeBookModal = document.getElementById('closeBookDetailsModal');
  if (bookModal && closeBookModal) {
    closeBookModal.addEventListener('click', () => bookModal.classList.remove('active'));
    bookModal.addEventListener('click', (e) => {
      if (e.target === bookModal) bookModal.classList.remove('active');
    });
  }

  const uploadModal = document.getElementById('uploadModal');
  const closeUpload = document.getElementById('closeUploadModal');
  if (uploadModal && closeUpload) {
    closeUpload.addEventListener('click', () => uploadModal.classList.remove('active'));
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) uploadModal.classList.remove('active');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active, .pdf-modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

/* 📄 PDF MODAL */
function setupPDFModal() {
  const overlay = document.getElementById('pdfModalOverlay');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
  document.getElementById('closePdfModal')?.addEventListener('click', () => overlay.classList.remove('active'));
}

window.openPDFModal = function(url, title) {
  const overlay = document.getElementById('pdfModalOverlay');
  const iframe = document.getElementById('pdfIframe');
  const titleEl = document.getElementById('pdfModalTitle');
  if (!overlay || !iframe) return;
  if (titleEl) titleEl.textContent = title || 'Document Viewer';
  iframe.src = url;
  overlay.classList.add('active');
};

/* 🔔 TOAST NOTIFICATION SYSTEM */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fa-solid fa-circle-check',
    warning: 'fa-solid fa-triangle-exclamation',
    danger: 'fa-solid fa-circle-xmark',
    info: 'fa-solid fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.closest('.toast').remove()"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
window.showToast = showToast;

/* 🔐 PASSWORD VISIBILITY TOGGLE */
window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
};

/* 👤 NAV USER SESSION */
async function updateNavUserUI() {
  const currentUser = await window.BookAPI.getCurrentUser();
  const navActions = document.querySelector('.nav-actions');
  const mobileActions = document.querySelector('.drawer-actions');
  const navLinks = document.querySelector('.nav-links');
  const drawerLinks = document.querySelector('.drawer-links');
  const adminNavActions = document.getElementById('adminNavActions');

  if (!currentUser) return;

  const isDashboard = window.location.pathname.toLowerCase().includes('dashboard');
  const isAdmin = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'].includes((currentUser.role || '').toUpperCase());

  // Add Dashboard link
  if (navLinks && !navLinks.querySelector('a[href*="dashboard"]')) {
    const dashLink = document.createElement('a');
    dashLink.href = 'dashboard.html';
    dashLink.className = `nav-link ${isDashboard ? 'active' : ''}`;
    dashLink.innerHTML = `<i class="fa-solid fa-gauge" style="margin-right: 4px;"></i> Dashboard`;
    navLinks.appendChild(dashLink);
  }

  // Add Admin link if user has admin privileges
  if (isAdmin && navLinks && !navLinks.querySelector('a[href*="admin"]')) {
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.className = 'nav-link';
    adminLink.innerHTML = `<i class="fa-solid fa-shield-halved" style="margin-right: 4px;"></i> Admin`;
    navLinks.appendChild(adminLink);
  }

  const role = (currentUser.role || 'STUDENT').toUpperCase();
  const userHTML = `
    <span style="font-size: 13px; font-weight: 600; color: var(--color-primary); display: inline-flex; align-items: center; gap: 6px;">
      <i class="fa-solid fa-user-circle"></i> ${currentUser.name}
    </span>
    <a href="dashboard.html" class="btn btn-ghost btn-sm"><i class="fa-solid fa-gauge"></i> Dashboard</a>
    ${isAdmin ? '<a href="admin.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-shield-halved"></i> Admin</a>' : ''}
    <button id="btnNavLogout" class="btn btn-ghost btn-sm">Logout</button>
  `;

  if (navActions && !adminNavActions) navActions.innerHTML = userHTML;
  if (mobileActions) {
    mobileActions.innerHTML = `
      <div style="font-size: 13px; font-weight: 600; color: var(--color-primary); padding: 8px 0;">
        <i class="fa-solid fa-user-circle"></i> ${currentUser.name} (${role})
      </div>
      <a href="dashboard.html" class="btn btn-ghost btn-block" style="margin-bottom:8px;text-decoration:none;"><i class="fa-solid fa-gauge"></i> Dashboard</a>
      ${isAdmin ? '<a href="admin.html" class="btn btn-secondary btn-block" style="margin-bottom:8px;text-decoration:none;"><i class="fa-solid fa-shield-halved"></i> Admin Portal</a>' : ''}
      <button id="btnMobileLogout" class="btn btn-secondary btn-block">Logout</button>
    `;
  }

  const logoutHandler = async () => {
    await window.BookAPI.logout();
    showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.href = 'login.html', 600);
  };

  document.getElementById('btnNavLogout')?.addEventListener('click', logoutHandler);
  document.getElementById('btnMobileLogout')?.addEventListener('click', logoutHandler);
}

/* ==========================================================================
   BOOK CARD RENDERER
   ========================================================================== */

async function renderBooksGrid(container, books, actionLabel = 'View Details') {
  if (!container) return;

  if (!books || books.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No Books Found</h3>
        <p>No books match your current criteria. Try changing filters or search terms.</p>
        <a href="browse.html" class="btn btn-secondary btn-sm">Browse All Books</a>
      </div>
    `;
    return;
  }

  let wishlistIds = [];
  try {
    wishlistIds = await window.BookAPI.getWishlistIds();
  } catch (e) {
    wishlistIds = [];
  }

  container.innerHTML = books.map(b => {
    const isWished = wishlistIds.includes(b.id);
    const ratingVal = b.rating || 4.8;
    const mode = (b.mode || 'sell').toLowerCase();
    const typeLabel = mode.toUpperCase();
    const initials = (b.seller?.name || 'BB').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const isDonation = b.price === 0 || mode === 'donate';
    const isSold = (b.status || '').toLowerCase() === 'sold' || (b.status || '').toLowerCase() === 'exchanged' || (b.status || '').toLowerCase() === 'donated';
    const coverImg = b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
    const isDigital = Boolean(b.pdf_url);
    const safeTitle = (b.title || '').replace(/'/g, '');

    let actionBtnHTML = '';
    if (isSold) {
      actionBtnHTML = `<span class="badge" style="background: var(--color-gray); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">${(b.status || 'SOLD').toUpperCase()}</span>`;
    } else if (mode === 'sell') {
      actionBtnHTML = `<button class="btn btn-primary btn-sm" onclick="openBuyBookModal('${b.id}')"><i class="fa-solid fa-cart-shopping"></i> Buy Now</button>`;
    } else if (mode === 'exchange') {
      actionBtnHTML = `<button class="btn btn-primary btn-sm" onclick="handleBookAction('${b.id}', 'Propose Swap')"><i class="fa-solid fa-arrows-rotate"></i> Swap</button>`;
    } else {
      actionBtnHTML = `<button class="btn btn-primary btn-sm" onclick="handleBookAction('${b.id}', 'Claim Free')"><i class="fa-solid fa-gift"></i> Claim</button>`;
    }

    return `
      <div class="book-card ${isSold ? 'opacity-75' : ''}">
        <div class="book-card-actions">
          <button class="card-action-btn ${isWished ? 'active' : ''}" onclick="handleToggleWishlist(event, '${b.id}')" title="Wishlist" aria-label="Toggle wishlist">
            <i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          <button class="card-action-btn" onclick="handleShare('${safeTitle}', '${b.id}')" title="Share" aria-label="Share book">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>

        <div class="book-cover">
          ${isSold ? `<span class="sold-badge" style="position: absolute; top: 10px; left: 10px; background: #dc2626; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; z-index: 2;"><i class="fa-solid fa-circle-check"></i> ${b.status}</span>` : (isDonation ? '<span class="donation-badge"><i class="fa-solid fa-gift"></i> FREE</span>' : '')}
          <img src="${coverImg}" alt="${b.title}" loading="lazy">
        </div>

        <div class="book-body">
          <div class="book-meta-row">
            <span class="book-category">${b.branch || b.genre || 'Academic'}</span>
            <span class="book-type">${typeLabel}</span>
          </div>

          <div class="book-title" onclick="handleBookAction('${b.id}', 'View Details')" style="cursor: pointer;">${b.title}</div>
          <div class="book-author">by ${b.author || 'Unknown'} · ${b.edition || 'Latest'}</div>

          <div class="book-details">
            <span class="book-detail-tag"><i class="fa-solid fa-language"></i> ${b.language || 'English'}</span>
            <span class="book-detail-tag"><i class="fa-solid fa-tag"></i> ${b.condition || 'Good'}</span>
            <span class="book-detail-tag"><i class="fa-solid fa-location-dot"></i> ${(b.location || 'Campus').substring(0, 15)}</span>
          </div>

          <div class="book-rating">
            <i class="fa-solid fa-star"></i> ${ratingVal}
            <span style="color: var(--color-gray-light); margin-left: 4px;">· ${b.status || 'Available'}</span>
          </div>

          <div class="book-seller">
            <span class="book-seller-avatar">${initials}</span>
            <span>${b.seller?.name || 'Student'}</span>
            ${b.seller?.is_verified ? '<i class="fa-solid fa-circle-check" style="color:var(--color-primary);font-size:12px;" title="Verified Student"></i>' : ''}
          </div>

          <div class="book-footer">
            <div class="${isDonation ? 'book-price-free' : 'book-price'}">
              ${isDonation ? 'FREE' : '&#8377;' + b.price}
              ${b.original && b.price > 0 ? '<span class="original-price">&#8377;' + b.original + '</span>' : ''}
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              ${actionBtnHTML}
              <button class="btn btn-ghost btn-sm" onclick="handleBookAction('${b.id}', 'View Details')" title="View details"><i class="fa-solid fa-info-circle"></i></button>
            </div>
          </div>

          ${isDigital ? `
            <div style="margin-top:8px;">
              <button class="btn-pdf-view" onclick="openPDFModal('${b.pdf_url}', '${safeTitle}')">
                <i class="fa-solid fa-file-pdf"></i> View Lab PDF
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* 🛒 BUY BOOK CHECKOUT / CAMPUS HANDOVER MODAL */
window.openBuyBookModal = async function(bookId) {
  let book;
  try {
    book = await window.BookAPI.getBookById(bookId);
  } catch (e) {
    showToast('Failed to load book details', 'danger');
    return;
  }

  if (!book) {
    showToast('Book not found', 'warning');
    return;
  }

  const currentUser = await window.BookAPI.getCurrentUser();
  if (!currentUser) {
    showToast('Please login to purchase or reserve books', 'warning');
    setTimeout(() => window.location.href = `login.html?redirect=browse.html`, 1000);
    return;
  }

  let modal = document.getElementById('buyBookModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'buyBookModal';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 540px;">
        <div class="modal-header">
          <h3><i class="fa-solid fa-handshake" style="color: var(--color-primary);"></i> Campus Handover & Checkout</h3>
          <button class="modal-close" onclick="document.getElementById('buyBookModal').classList.remove('active')" aria-label="Close modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div id="buyBookModalBody"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const bodyEl = document.getElementById('buyBookModalBody');
  const seller = book.seller || { name: 'Student Seller' };
  const coverImg = book.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

  bodyEl.innerHTML = `
    <div style="display: flex; gap: 14px; background: rgba(62,107,58,0.06); padding: 14px; border-radius: 12px; margin-bottom: 18px; border: 1px solid var(--color-border);">
      <img src="${coverImg}" style="width: 70px; height: 95px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
      <div style="flex: 1;">
        <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: var(--color-dark);">${book.title}</h4>
        <p style="margin: 0 0 6px; font-size: 13px; color: var(--color-gray);">by ${book.author || 'Unknown'} · ${book.branch || 'CE'} (Sem ${book.semester || 1})</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: 800; color: var(--color-primary);">&#8377;${book.price}</span>
          <span style="font-size: 12px; color: var(--color-gray-dark); background: #fff; padding: 2px 8px; border-radius: 12px; border: 1px solid #e2e8f0;">Seller: ${seller.name}</span>
        </div>
      </div>
    </div>

    <form id="buyBookCheckoutForm">
      <div class="form-group" style="margin-bottom: 12px;">
        <input type="text" id="buyerFullName" class="form-input" value="${currentUser.name || ''}" required>
        <label class="form-label">Buyer Full Name *</label>
      </div>

      <div class="form-group" style="margin-bottom: 12px;">
        <select id="buyerPickupPref" class="form-select" required>
          <option value="Campus Central Library">Campus Central Library (Recommended)</option>
          <option value="Department CE Lab Floor">Department Lab / Classroom</option>
          <option value="Campus Canteen Area">Campus Canteen / Student Plaza</option>
        </select>
      </div>

      <div class="form-group" style="margin-bottom: 14px;">
        <select id="buyerPaymentChoice" class="form-select" required>
          <option value="DIRECT_HANDOVER">Direct Handover (Cash on In-Person Verification)</option>
          <option value="DIRECT_UPI">Direct UPI on Campus (GPay / PhonePe / Paytm)</option>
        </select>
      </div>

      <div class="form-group" style="margin-bottom: 18px;">
        <textarea id="buyerNotesText" class="form-input" placeholder=" " style="min-height: 60px;"></textarea>
        <label class="form-label">Message for Seller (Preferred meeting time / lab)</label>
      </div>

      <div style="display: flex; gap: 10px;">
        <button type="button" class="btn btn-ghost" style="flex: 1;" onclick="document.getElementById('buyBookModal').classList.remove('active')">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex: 2;"><i class="fa-solid fa-check"></i> Initiate Handover (&#8377;${book.price})</button>
      </div>
    </form>
  `;

  modal.classList.add('active');

  const form = document.getElementById('buyBookCheckoutForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

    try {
      const gateway = document.getElementById('buyerPaymentChoice').value;
      const intent = await window.BookAPI.createPaymentIntent(book.id, gateway);

      // Send initial inquiry message to seller
      const pickupLoc = document.getElementById('buyerPickupPref').value;
      const notes = document.getElementById('buyerNotesText').value.trim();
      const messageText = `Hi! I want to purchase your book "${book.title}" (₹${book.price}). Proposed pickup location: ${pickupLoc}. ${notes}`;

      await window.BookAPI.sendMessage(seller.email || 'seller@bookbridge.local', messageText, book.title).catch(() => {});

      modal.classList.remove('active');
      showToast(intent.message || `Handover initiated with ${seller.name}! Check your messages to coordinate meetup.`, 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 1200);
    } catch (err) {
      showToast(err.message || 'Failed to initiate handover request', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Initiate Handover (&#8377;${book.price})`;
    }
  });
};

/* ❤️ WISHLIST TOGGLE */
window.handleToggleWishlist = async function(e, bookId) {
  e.stopPropagation();
  const currentUser = await window.BookAPI.getCurrentUser();
  if (!currentUser) {
    showToast('Please login to manage your wishlist', 'warning');
    setTimeout(() => window.location.href = 'login.html', 800);
    return;
  }

  try {
    const added = await window.BookAPI.toggleWishlist(bookId);
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');

    if (added) {
      btn.classList.add('active');
      if (icon) icon.className = 'fa-solid fa-heart';
      showToast('Added to wishlist', 'success');
    } else {
      btn.classList.remove('active');
      if (icon) icon.className = 'fa-regular fa-heart';
      showToast('Removed from wishlist', 'info');
    }
  } catch (err) {
    showToast(err.message || 'Could not update wishlist', 'danger');
  }
};

/* 📤 SHARE */
window.handleShare = function(title, id) {
  const url = `${window.location.origin}/browse.html?book=${id}`;
  if (navigator.share) {
    navigator.share({ title: `${title} - BookBridge`, url })
      .catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied to clipboard!', 'success'))
      .catch(() => showToast('Could not copy link', 'warning'));
  }
};

/* 📖 BOOK ACTION MODAL */
window.handleBookAction = async function(bookId, actionLabel) {
  let book;
  try {
    book = await window.BookAPI.getBookById(bookId);
  } catch (e) {
    showToast('Could not load book details', 'danger');
    return;
  }

  if (!book) return;

  const modal = document.getElementById('bookDetailsModal');
  const titleEl = document.getElementById('modalBookTitle');
  const bodyEl = document.getElementById('modalBookBody');
  const waBtn = document.getElementById('btnModalWhatsapp');
  const confirmBtn = document.getElementById('btnModalActionConfirm');

  if (!modal) return;

  titleEl.textContent = book.title;
  const seller = book.seller || { name: 'Student Seller' };
  const ratingVal = book.rating || 4.8;
  const mode = (book.mode || 'sell').toLowerCase();

  bodyEl.innerHTML = `
    <div style="display: grid; gap: 10px; font-size: 14px; line-height: 1.8;">
      <div class="flex-between"><span style="color: var(--color-gray);">Author</span><strong>${book.author || 'N/A'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Department</span><span class="badge badge-primary">${book.branch || 'CE'}</span></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Condition</span><strong>${book.condition || 'Good'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Semester</span><strong>${book.semester ? 'Sem ' + book.semester : 'N/A'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Price</span><strong style="color: var(--color-primary);">${book.price > 0 ? '&#8377;' + book.price : 'FREE'}</strong></div>
      ${book.exchange_for ? `<div class="flex-between"><span style="color: var(--color-gray);">Looking to Swap For</span><span style="font-size:13px;font-weight:600;">${book.exchange_for}</span></div>` : ''}
      <div style="padding: 12px; background: rgba(0,0,0,0.02); border-radius: 8px; margin-top: 4px;">
        <span style="color: var(--color-gray); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Description</span>
        <p style="margin-top: 4px; color: var(--color-dark);">${book.description || 'Academic resource listed on BookBridge.'}</p>
      </div>
      <div class="flex-between"><span style="color: var(--color-gray);">Listed by</span><strong>${seller.name}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Campus Location</span><strong>${book.location || 'Campus'}</strong></div>
    </div>
  `;

  if (waBtn) {
    waBtn.style.display = 'none';
  }

  if (mode === 'sell' && (book.status || '').toLowerCase() === 'available') {
    confirmBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Buy Now (₹${book.price})`;
    confirmBtn.onclick = () => {
      modal.classList.remove('active');
      openBuyBookModal(book.id);
    };
  } else if (mode === 'exchange' && (book.status || '').toLowerCase() === 'available') {
    confirmBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Propose Swap`;
    confirmBtn.onclick = async () => {
      const user = await window.BookAPI.getCurrentUser();
      if (!user) {
        showToast('Please login to propose a book swap', 'warning');
        setTimeout(() => window.location.href = 'login.html', 800);
        return;
      }
      const offeredTitle = prompt(`Enter the title of the book you want to offer in exchange for "${book.title}":`);
      if (!offeredTitle) return;

      try {
        await window.BookAPI.proposeExchange({
          target_book: book.id,
          offered_book_title: offeredTitle,
          note: `Swap proposal by ${user.name}`
        });
        showToast('Exchange proposal sent to the seller!', 'success');
        modal.classList.remove('active');
      } catch (err) {
        showToast(err.message || 'Failed to submit exchange proposal', 'danger');
      }
    };
  } else if (mode === 'donate' && (book.status || '').toLowerCase() === 'available') {
    confirmBtn.innerHTML = `<i class="fa-solid fa-gift"></i> Claim Free Book`;
    confirmBtn.onclick = async () => {
      const user = await window.BookAPI.getCurrentUser();
      if (!user) {
        showToast('Please login to claim free donations', 'warning');
        setTimeout(() => window.location.href = 'login.html', 800);
        return;
      }
      const msg = prompt('Enter a short note for the donor explaining why you need this book:') || 'Academic study requirement';
      try {
        await window.BookAPI.claimDonation(book.id, msg);
        showToast('Donation claim submitted to donor!', 'success');
        modal.classList.remove('active');
      } catch (err) {
        showToast(err.message || 'Failed to submit donation claim', 'danger');
      }
    };
  } else {
    confirmBtn.textContent = 'Contact Seller';
    confirmBtn.onclick = async () => {
      const user = await window.BookAPI.getCurrentUser();
      if (!user) {
        showToast('Please login to message the seller', 'warning');
        setTimeout(() => window.location.href = 'login.html', 800);
        return;
      }
      const msg = prompt(`Send a message to ${seller.name} regarding "${book.title}":`);
      if (!msg) return;
      try {
        await window.BookAPI.sendMessage(seller.email || 'seller@bookbridge.local', msg, book.title);
        showToast(`Message sent to ${seller.name}!`, 'success');
        modal.classList.remove('active');
      } catch (err) {
        showToast(err.message || 'Failed to send message', 'danger');
      }
    };
  }

  modal.classList.add('active');
};

/* ==========================================================================
   PAGE CONTROLLERS
   ========================================================================== */

/* 🏠 HOME */
async function initHomePage() {
  const grid = document.getElementById('popularBooksGrid');
  if (!grid) return;

  try {
    const books = await window.BookAPI.getBooks();
    await renderBooksGrid(grid, books.slice(0, 8), 'View Details');

    const tabsContainer = document.getElementById('homeBookTabs');
    if (tabsContainer) {
      const tabs = tabsContainer.querySelectorAll('.home-tab-pill');
      tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const filter = tab.dataset.filter;
          let filtered = [...books];

          if (filter === 'sell') {
            filtered = filtered.filter(b => b.mode === 'sell');
          } else if (filter === 'popular') {
            filtered = filtered.filter(b => (b.rating || 0) >= 4.7);
          } else if (filter === 'exchange') {
            filtered = filtered.filter(b => b.mode === 'exchange');
          } else if (filter === 'donate') {
            filtered = filtered.filter(b => b.mode === 'donate' || b.price === 0);
          } else if (filter !== 'all') {
            filtered = filtered.filter(b => (b.branch || '').toUpperCase() === filter.toUpperCase() || (b.genre || '').toLowerCase().includes(filter.toLowerCase()));
          }

          await renderBooksGrid(grid, filtered.slice(0, 8), 'View Details');
        });
      });
    }

    // AI recommendations for authenticated student
    const aiSection = document.getElementById('aiRecommendationsSection');
    const aiGrid = document.getElementById('aiRecommendationsGrid');
    if (aiSection && aiGrid) {
      const user = await window.BookAPI.getCurrentUser();
      if (user) {
        const recs = await window.BookAPI.getAIRecommendations(user.branch || 'CE', user.semester || 1).catch(() => []);
        if (recs && recs.length > 0) {
          aiSection.style.display = 'block';
          const branchInfo = document.getElementById('aiRecBranchInfo');
          if (branchInfo) branchInfo.textContent = `Personalized for: ${user.branch || 'CE'} · Semester ${user.semester || 1}`;
          await renderBooksGrid(aiGrid, recs.slice(0, 4), 'View Details');
        }
      }
    }
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Unable to load catalog</h3><p>${err.message}</p></div>`;
  }
}

/* 🔍 BROWSE */
async function initBrowsePage() {
  const grid = document.getElementById('browseBooksGrid');
  const searchInput = document.getElementById('browseSearchInput');
  const searchBtn = document.getElementById('btnBrowseSearch');
  const pills = document.querySelectorAll('#deptPillsBar .filter-pill');
  const subjectSelect = document.getElementById('browseSubjectSelect');
  const conditionSelect = document.getElementById('browseConditionSelect');
  const maxPriceInput = document.getElementById('browseMaxPrice');
  const sortSelect = document.getElementById('browseSortSelect');
  const resultsCount = document.getElementById('browseResultsCount');

  const params = new URLSearchParams(window.location.search);
  if (searchInput && params.get('q')) searchInput.value = params.get('q');

  let currentBranch = params.get('branch') || 'ALL';

  if (currentBranch !== 'ALL') {
    pills.forEach(p => {
      p.classList.remove('active');
      if (p.dataset.dept === currentBranch) p.classList.add('active');
    });
  }

  let debounceTimer;

  async function fetchAndRender() {
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top:12px;">Loading books...</p></div>';

    const filters = {};
    const query = searchInput?.value.trim();
    if (query) filters.search = query;
    if (currentBranch !== 'ALL') filters.branch = currentBranch;
    if (subjectSelect?.value && subjectSelect.value !== 'All Subjects') filters.subject = subjectSelect.value;
    if (conditionSelect?.value && conditionSelect.value !== 'Any Condition') filters.condition = conditionSelect.value;
    if (maxPriceInput?.value) filters.max_price = maxPriceInput.value;
    if (sortSelect?.value) {
      if (sortSelect.value === 'price-low') filters.ordering = 'price';
      else if (sortSelect.value === 'price-high') filters.ordering = '-price';
      else if (sortSelect.value === 'rating') filters.ordering = '-rating';
      else filters.ordering = '-created_at';
    }

    try {
      const books = await window.BookAPI.getBooks(filters);
      if (resultsCount) resultsCount.textContent = `${books.length} book${books.length !== 1 ? 's' : ''} found`;
      await renderBooksGrid(grid, books, 'View Details');
    } catch (err) {
      grid.innerHTML = `<div class="empty-state"><h3>Search Error</h3><p>${err.message}</p></div>`;
    }
  }

  function debouncedSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchAndRender, 300);
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentBranch = pill.dataset.dept || 'ALL';
      fetchAndRender();
    });
  });

  searchBtn?.addEventListener('click', fetchAndRender);
  searchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchAndRender(); });
  searchInput?.addEventListener('input', debouncedSearch);
  subjectSelect?.addEventListener('change', fetchAndRender);
  conditionSelect?.addEventListener('change', fetchAndRender);
  maxPriceInput?.addEventListener('input', debouncedSearch);
  sortSelect?.addEventListener('change', fetchAndRender);

  fetchAndRender();
}

/* 🏷️ SELL PAGE */
async function initSellPage() {
  const form = document.getElementById('sellPageBookForm');
  if (!form) return;

  const modeCards = document.querySelectorAll('.sell-mode-card');
  const priceGroup = document.getElementById('sellPriceGroup');
  const exchangeGroup = document.getElementById('sellExchangeForGroup');
  const priceInput = document.getElementById('sellPrice');

  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => {
        c.classList.remove('active');
        c.style.borderColor = 'var(--color-border)';
        c.style.background = '#fff';
      });
      card.classList.add('active');
      card.style.borderColor = 'var(--color-primary)';
      card.style.background = 'rgba(62,107,58,0.06)';

      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        const val = radio.value;
        if (val === 'sell') {
          if (priceGroup) priceGroup.style.display = 'block';
          if (exchangeGroup) exchangeGroup.style.display = 'none';
          if (priceInput) priceInput.value = '150';
        } else if (val === 'exchange') {
          if (priceGroup) priceGroup.style.display = 'none';
          if (exchangeGroup) exchangeGroup.style.display = 'block';
          if (priceInput) priceInput.value = '0';
        } else if (val === 'donate') {
          if (priceGroup) priceGroup.style.display = 'none';
          if (exchangeGroup) exchangeGroup.style.display = 'none';
          if (priceInput) priceInput.value = '0';
        }
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = await window.BookAPI.getCurrentUser();
    if (!currentUser) {
      showToast('Please login to publish your book listing.', 'warning');
      setTimeout(() => window.location.href = 'login.html?redirect=sell.html', 1000);
      return;
    }

    const submitBtn = document.getElementById('btnSubmitSellBook');
    if (submitBtn) submitBtn.classList.add('btn-loading');

    const selectedMode = form.querySelector('input[name="sellMode"]:checked')?.value || 'sell';
    const bookData = {
      title: document.getElementById('sellTitle')?.value.trim() || '',
      author: document.getElementById('sellAuthor')?.value.trim() || '',
      branch: document.getElementById('sellBranch')?.value || 'CE',
      semester: parseInt(document.getElementById('sellSemester')?.value, 10) || 1,
      gtu_code: document.getElementById('sellGtuCode')?.value.trim() || '',
      condition: document.getElementById('sellCondition')?.value || 'Good',
      price: selectedMode === 'sell' ? (parseFloat(priceInput?.value) || 0) : 0,
      mode: selectedMode,
      exchange_for: document.getElementById('sellExchangeFor')?.value.trim() || '',
      location: document.getElementById('sellLocation')?.value || 'Campus Central Library',
      cover_url: document.getElementById('sellCover')?.value.trim() || '',
      description: document.getElementById('sellDescription')?.value.trim() || '',
    };

    try {
      const saved = await window.BookAPI.addBook(bookData);
      if (submitBtn) submitBtn.classList.remove('btn-loading');
      showToast(`Success! "${saved?.title || bookData.title}" is now live on campus.`, 'success');
      setTimeout(() => window.location.href = 'browse.html', 1200);
    } catch (err) {
      if (submitBtn) submitBtn.classList.remove('btn-loading');
      showToast(err.message || 'Failed to list book. Please check details.', 'danger');
    }
  });
}

/* 🔄 EXCHANGE */
async function initExchangePage() {
  const grid = document.getElementById('exchangeGrid');
  const triggerBtn = document.getElementById('btnUploadBookTrigger');
  const modal = document.getElementById('uploadModal');
  const form = document.getElementById('uploadBookForm');

  triggerBtn?.addEventListener('click', async () => {
    const user = await window.BookAPI.getCurrentUser();
    if (!user) {
      showToast('Please login to list a book for exchange', 'warning');
      setTimeout(() => window.location.href = 'login.html', 800);
      return;
    }
    modal?.classList.add('active');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    const newBook = {
      title: document.getElementById('uploadTitle').value.trim(),
      author: document.getElementById('uploadAuthor').value.trim(),
      branch: document.getElementById('uploadBranch').value,
      semester: parseInt(document.getElementById('uploadSemester')?.value, 10) || 1,
      gtu_code: document.getElementById('uploadGtuCode')?.value.trim() || '',
      condition: document.getElementById('uploadCondition')?.value || 'Good',
      description: document.getElementById('uploadDescription')?.value.trim() || '',
      exchange_for: document.getElementById('uploadExchangeFor')?.value.trim() || '',
      price: parseFloat(document.getElementById('uploadPrice')?.value) || 0,
      mode: 'exchange',
    };

    try {
      const saved = await window.BookAPI.addBook(newBook);
      submitBtn.classList.remove('btn-loading');
      showToast(`"${saved?.title || newBook.title}" listed for exchange!`, 'success');
      modal?.classList.remove('active');
      form.reset();
      fetchAndRender();
    } catch (err) {
      submitBtn.classList.remove('btn-loading');
      showToast(err.message || 'Failed to list book', 'danger');
    }
  });

  async function fetchAndRender() {
    if (!grid) return;
    try {
      const books = await window.BookAPI.getBooks({ mode: 'exchange' });
      await renderBooksGrid(grid, books, 'Swap');
    } catch (err) {
      grid.innerHTML = `<div class="empty-state"><h3>Unable to load exchange listings</h3><p>${err.message}</p></div>`;
    }
  }

  fetchAndRender();
}

/* 🎁 DONATE */
async function initDonatePage() {
  const grid = document.getElementById('donateBooksGrid');
  if (!grid) return;

  try {
    const books = await window.BookAPI.getBooks({ mode: 'donate' });
    await renderBooksGrid(grid, books, 'Claim Free');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h3>Unable to load donation listings</h3><p>${err.message}</p></div>`;
  }
}

/* 📬 CONTACT */
function initContactPage() {
  const form = document.getElementById('contactPageForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName')?.value || '';
    const email = document.getElementById('contactEmail')?.value || '';
    const text = document.getElementById('contactMessage')?.value || '';

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    try {
      await window.BookAPI.sendMessage('support@bookbridge.local', `Support Request from ${name} (${email}): ${text}`, 'Contact Support');
      submitBtn.classList.remove('btn-loading');
      showToast(`Thank you, ${name}! Your message has been received.`, 'success');
      form.reset();
    } catch (err) {
      submitBtn.classList.remove('btn-loading');
      showToast(err.message || 'Failed to send message', 'danger');
    }
  });
}

/* 🔑 LOGIN */
function initLoginPage() {
  const form = document.getElementById('dedicatedLoginForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const submitBtn = document.getElementById('loginSubmitBtn');

    let valid = true;
    if (!email) {
      document.getElementById('loginEmail')?.closest('.input-group, .form-group')?.classList.add('error');
      valid = false;
    }
    if (!password) {
      document.getElementById('loginPassword')?.closest('.input-group, .form-group')?.classList.add('error');
      valid = false;
    }
    if (!valid) return;

    if (submitBtn) submitBtn.classList.add('btn-loading');

    try {
      const user = await window.BookAPI.login(email, password);
      if (submitBtn) submitBtn.classList.remove('btn-loading');

      if (user) {
        showToast(`Welcome back, ${user.name}!`, 'success');
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'browse.html';
        setTimeout(() => window.location.href = redirectUrl, 800);
      } else {
        showToast('Invalid credentials.', 'danger');
      }
    } catch (err) {
      if (submitBtn) submitBtn.classList.remove('btn-loading');
      showToast(err.message || 'Login failed. Please check your credentials.', 'danger');
    }
  });

  document.querySelectorAll('#dedicatedLoginForm input').forEach(input => {
    input.addEventListener('focus', () => {
      input.closest('.input-group, .form-group')?.classList.remove('error');
    });
  });
}

/* 📝 REGISTER */
function initRegisterPage() {
  const form = document.getElementById('dedicatedRegisterForm');
  const passwordInput = document.getElementById('regPassword');
  const enrollmentInput = document.getElementById('regEnrollment');
  const collegeSelect = document.getElementById('regCollege');
  const helpText = document.getElementById('collegeVerifyHelpText');

  if (enrollmentInput) {
    enrollmentInput.addEventListener('input', () => {
      const val = enrollmentInput.value.trim();
      if (val.length >= 10) {
        if (helpText) {
          helpText.innerHTML = '<span style="color: var(--color-primary); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Valid College Student Enrollment Detected</span>';
        }
      } else {
        if (helpText) {
          helpText.textContent = 'Enter your College & Enrollment ID to receive a Verified Student Badge.';
        }
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      const bars = [document.getElementById('str1'), document.getElementById('str2'), document.getElementById('str3'), document.getElementById('str4')];
      const text = document.getElementById('passwordStrengthText');
      let strength = 0;

      if (val.length >= 4) strength++;
      if (val.length >= 8) strength++;
      if (/[A-Z]/.test(val) && /[0-9]/.test(val)) strength++;
      if (/[^a-zA-Z0-9]/.test(val) && val.length >= 10) strength++;

      const levels = ['', 'weak', 'medium', 'medium', 'strong'];
      const labels = ['', 'Weak password', 'Fair password', 'Good password', 'Strong password'];
      const colors = ['', 'var(--color-danger)', 'var(--color-warning)', 'var(--color-warning)', 'var(--color-success)'];

      bars.forEach((bar, i) => {
        if (!bar) return;
        bar.className = 'strength-bar';
        if (i < strength) bar.classList.add(levels[strength]);
      });
      if (text) {
        text.textContent = labels[strength];
        text.style.color = colors[strength];
      }
    });
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('registerSubmitBtn');

    const userData = {
      name: document.getElementById('regName')?.value.trim() || '',
      full_name: document.getElementById('regName')?.value.trim() || '',
      email: document.getElementById('regEmail')?.value.trim() || '',
      password: document.getElementById('regPassword')?.value.trim() || '',
      college_name: collegeSelect?.value || 'GTU Affiliated College',
      enrollment: enrollmentInput?.value.trim() || '',
      branch: document.getElementById('regBranch')?.value || 'CE',
      semester: parseInt(document.getElementById('regSemester')?.value, 10) || 1,
    };

    let valid = true;
    ['regName', 'regEmail', 'regPassword', 'regEnrollment'].forEach(id => {
      const input = document.getElementById(id);
      if (!input || !input.value.trim()) {
        input?.closest('.form-group')?.classList.add('error');
        valid = false;
      }
    });

    if (collegeSelect && !collegeSelect.value) {
      collegeSelect.closest('.form-group')?.classList.add('error');
      valid = false;
    }

    if (!document.getElementById('regTerms')?.checked) {
      showToast('Please accept the Terms of Service and Privacy Policy', 'warning');
      return;
    }

    if (!valid) return;

    if (submitBtn) submitBtn.classList.add('btn-loading');
    try {
      const user = await window.BookAPI.register(userData);
      if (submitBtn) submitBtn.classList.remove('btn-loading');
      if (user) {
        showToast(`🎉 Verified! Welcome, ${user.name}! Your college account is active.`, 'success');
        setTimeout(() => window.location.href = 'browse.html', 1000);
      }
    } catch (err) {
      if (submitBtn) submitBtn.classList.remove('btn-loading');
      showToast(err.message || 'Registration failed. Please check your details.', 'danger');
    }
  });

  document.querySelectorAll('#dedicatedRegisterForm .form-input, #dedicatedRegisterForm .form-select').forEach(input => {
    input.addEventListener('focus', () => input.closest('.form-group')?.classList.remove('error'));
    input.addEventListener('change', () => input.closest('.form-group')?.classList.remove('error'));
  });
}

/* 🛡️ ADMIN */
async function initAdminPage() {
  const currentUser = await window.BookAPI.getCurrentUser();
  const isAdmin = currentUser && ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'].includes((currentUser.role || '').toUpperCase());

  if (!isAdmin) {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-bg);font-family:var(--font-sans);padding:24px;">
        <div style="max-width:440px;background:#fff;padding:32px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.1);text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🔒</div>
          <h2 style="margin-bottom:8px;font-weight:700;">Admin Access Required</h2>
          <p style="color:var(--color-gray);font-size:14px;margin-bottom:20px;">You need staff or administrator privileges to view this portal.</p>
          <a href="login.html" class="btn btn-primary btn-block">Sign in as Administrator</a>
        </div>
      </div>
    `;
    return;
  }

  const tbody = document.getElementById('adminBooksTableBody');
  const searchInput = document.getElementById('adminBookSearch');
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminContentTabs = document.querySelectorAll('.admin-content-tab');

  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.adminTab;
      adminTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      adminContentTabs.forEach(t => t.classList.remove('active'));
      document.getElementById(`adminTab-${tab}`)?.classList.add('active');
      if (tab === 'users') fetchAdminUsers();
    });
  });

  async function fetchAdmin() {
    try {
      const stats = await window.BookAPI.getAdminStats();
      const els = {
        adminStatUsers: stats.totalUsers,
        adminStatBooks: stats.totalListings,
        adminStatSwaps: stats.activeSwaps || 0,
        adminStatDonations: stats.freeDonations || 0
      };
      Object.entries(els).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) { el.dataset.count = val; el.textContent = val.toLocaleString('en-IN'); }
      });

      if (!tbody) return;
      const books = await window.BookAPI.getBooks({ all: true });
      tbody.innerHTML = books.map(b => `
        <tr>
          <td><span style="color: var(--color-primary); font-weight: 600;">${b.gtu_code || b.id}</span></td>
          <td><strong>${b.title}</strong><br><span style="font-size:12px;color:var(--color-gray);">${b.author || ''}</span></td>
          <td><span class="badge badge-primary">${b.branch || 'CE'}</span></td>
          <td>${b.price > 0 ? '&#8377;' + b.price : 'Free'}</td>
          <td><span class="book-status-badge ${(b.status||'available').toLowerCase()}">${b.status || 'Available'}</span></td>
          <td style="text-align: right;">
            <button onclick="handleDeleteAdminBook('${b.id}')" class="btn btn-danger btn-sm" style="height: 32px; padding: 0 12px; font-size: 12px;">Delete</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--color-gray);padding:24px;">No books found.</td></tr>';
    } catch (err) {
      showToast(err.message || 'Failed to load admin stats', 'danger');
    }
  }

  async function fetchAdminUsers() {
    const usersTbody = document.getElementById('adminUsersTableBody');
    if (!usersTbody) return;
    try {
      const users = await window.BookAPI.getAllUsers();
      usersTbody.innerHTML = users.map(u => `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td style="font-size:13px;">${u.email}</td>
          <td><span class="badge badge-primary">${u.department_name || u.college_name || 'Academic'}</span></td>
          <td><span class="book-status-badge ${u.role === 'SUPER_ADMIN' ? 'available' : 'exchanged'}">${u.role}</span></td>
          <td style="font-size:12px;color:var(--color-gray);">${u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}</td>
          <td style="text-align: right;">
            <span class="badge badge-success">Active</span>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--color-gray);padding:24px;">No users found.</td></tr>';
    } catch (err) {
      showToast(err.message || 'Failed to load user list', 'danger');
    }
  }

  fetchAdmin();
}

window.handleDeleteAdminBook = async function(id) {
  if (confirm('Are you sure you want to remove this book listing?')) {
    try {
      await window.BookAPI.deleteBook(id);
      showToast('Book listing deleted', 'success');
      initAdminPage();
    } catch (err) {
      showToast(err.message || 'Failed to delete listing', 'danger');
    }
  }
};

/* 📊 DASHBOARD */
async function initDashboardPage() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.dataset.tab;
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      tabContents.forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + tabId)?.classList.add('active');
    });
  });

  const user = await window.BookAPI.getCurrentUser();
  const greeting = document.getElementById('dashboardGreeting');
  const profileCard = document.getElementById('profileCard');

  if (!user) {
    if (greeting) greeting.textContent = 'Please sign in to access your student dashboard.';
    setTimeout(() => window.location.href = 'login.html?redirect=dashboard.html', 1200);
    return;
  }

  if (greeting) greeting.textContent = `Welcome back, ${user.name}! 👋`;

  try {
    const allBooks = await window.BookAPI.getBooks({ all: true });
    const myBooks = allBooks.filter(b => b.seller?.id === user.id || b.seller?.email === user.email);
    const wishBooks = await window.BookAPI.getWishlistBooks().catch(() => []);

    const overviewEls = {
      dashMyBooks: myBooks.length,
      dashWishlist: wishBooks.length,
      dashExchanges: myBooks.filter(b => b.mode === 'exchange').length,
      dashDonations: myBooks.filter(b => b.mode === 'donate').length
    };
    Object.entries(overviewEls).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    if (profileCard) {
      profileCard.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--color-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;margin:0 auto 12px;">
            ${user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <h3 style="margin:0 0 4px;">${user.name}</h3>
          <p style="font-size:14px;color:var(--color-gray);margin:0;">${user.email}</p>
        </div>
        <div class="profile-stats-row">
          <div class="profile-stat-box">
            <div class="profile-stat-num">${myBooks.length}</div>
            <div class="profile-stat-label">Listed</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-num">${wishBooks.length}</div>
            <div class="profile-stat-label">Wishlisted</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-num">${myBooks.filter(b => b.mode === 'donate').length}</div>
            <div class="profile-stat-label">Donated</div>
          </div>
        </div>
        <div style="display:grid;gap:12px;font-size:14px;">
          <div class="flex-between"><span style="color:var(--color-gray);">Role</span><strong>${(user.role || 'STUDENT').toUpperCase()}</strong></div>
          <div class="flex-between"><span style="color:var(--color-gray);">College</span><strong>${user.college_name || 'GTU / University'}</strong></div>
          <div class="flex-between"><span style="color:var(--color-gray);">Status</span><span class="badge badge-success">Active Member</span></div>
        </div>
      `;
    }

    const myBooksGrid = document.getElementById('dashMyBooksGrid');
    if (myBooksGrid) {
      if (myBooks.length === 0) {
        myBooksGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📖</div>
            <h3>No Books Listed Yet</h3>
            <p>Upload your textbooks to start exchanging or selling with other students.</p>
            <a href="exchange.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> Upload Book</a>
          </div>
        `;
      } else {
        myBooksGrid.innerHTML = myBooks.map(b => `
          <div class="book-card">
            <div class="book-cover" style="height:140px;">
              <img src="${b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}" alt="${b.title}" loading="lazy">
            </div>
            <div class="book-body">
              <div class="book-meta-row">
                <span class="book-category">${b.branch || 'CE'}</span>
                <span class="book-type">${(b.mode || 'sell').toUpperCase()}</span>
              </div>
              <div class="book-title" style="font-size:14px;">${b.title}</div>
              <div class="book-author" style="font-size:12px;">by ${b.author || 'Unknown'}</div>
              <div class="book-footer" style="margin-top:8px;">
                <span class="book-status-badge ${(b.status || 'available').toLowerCase()}">${b.status || 'Available'}</span>
                <span style="font-size:13px;font-weight:600;color:var(--color-primary);">${b.price > 0 ? '&#8377;'+b.price : 'FREE'}</span>
              </div>
              <div class="my-book-actions" style="display:flex;gap:6px;margin-top:8px;">
                <button class="btn btn-ghost btn-sm" onclick="handleDeleteMyBook('${b.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    const wishlistGrid = document.getElementById('dashWishlistGrid');
    if (wishlistGrid && wishBooks.length > 0) {
      await renderBooksGrid(wishlistGrid, wishBooks, 'View');
    }

    // Load Messages
    const msgContainer = document.getElementById('dashboardMessagesContent');
    if (msgContainer) {
      const messages = await window.BookAPI.getMessages();
      if (!messages || messages.length === 0) {
        msgContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <h3>No Messages</h3>
            <p>Direct inquiries from other students will appear here.</p>
          </div>
        `;
      } else {
        msgContainer.innerHTML = `
          <div class="message-thread-list">
            ${messages.map(m => `
              <div class="msg-thread-item">
                <div class="msg-avatar" style="background:var(--color-primary);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;border-radius:50%;width:40px;height:40px;">
                  ${(m.sender_name || 'ST').substring(0, 2).toUpperCase()}
                </div>
                <div class="msg-thread-content" style="flex:1;margin-left:12px;">
                  <div class="msg-thread-name" style="font-weight:700;">${m.sender_name || m.sender_email}</div>
                  <div class="msg-thread-preview" style="font-size:13px;color:var(--color-gray);">${m.book_title ? '📖 ' + m.book_title + ': ' : ''}${m.text}</div>
                </div>
                <div class="msg-thread-meta" style="font-size:11px;color:var(--color-gray-light);">
                  ${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  } catch (err) {
    showToast(err.message || 'Error loading dashboard data', 'danger');
  }
}

window.handleDeleteMyBook = async function(bookId) {
  if (!confirm('Are you sure you want to remove this book listing?')) return;
  try {
    await window.BookAPI.deleteBook(bookId);
    showToast('Listing removed successfully', 'success');
    initDashboardPage();
  } catch (err) {
    showToast(err.message || 'Failed to delete listing', 'danger');
  }
};
