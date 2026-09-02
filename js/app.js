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

/* 🛡️ ADMIN FULL MANAGEMENT ENGINE */
let _adminCharts = {};

window.switchAdminTab = function(tabName) {
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-admin-tab]');
  const contentTabs = document.querySelectorAll('.admin-content-tab');

  sidebarLinks.forEach(link => {
    if (link.dataset.adminTab === tabName) link.classList.add('active');
    else link.classList.remove('active');
  });

  contentTabs.forEach(tab => {
    if (tab.id === `adminTab-${tabName}`) tab.classList.add('active');
    else tab.classList.remove('active');
  });

  // Trigger tab data load
  if (typeof window._loadAdminTab === 'function') {
    window._loadAdminTab(tabName);
  }
};

async function initAdminPage() {
  const currentUser = await window.BookAPI.getCurrentUser();
  const isAdmin = currentUser && (
    ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'DEPT_ADMIN', 'ADMIN'].includes((currentUser.role || '').toUpperCase()) ||
    Boolean(currentUser.is_staff || currentUser.is_superuser)
  );

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

  // ── Tab Switching Handlers ────────────────────────────────────────────────
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-admin-tab]');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.switchAdminTab(link.dataset.adminTab);
    });
  });

  // Sub tabs for Academic section
  const subTabBtns = document.querySelectorAll('.sub-tab-btn[data-sub-tab]');
  subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSub = btn.dataset.subTab;
      subTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.sub-content-tab').forEach(t => t.classList.remove('active'));
      document.getElementById(`subTab-${targetSub}`)?.classList.add('active');
      if (targetSub === 'colleges') loadColleges();
      else if (targetSub === 'departments') loadDepartments();
      else if (targetSub === 'courses') loadCourses();
    });
  });

  // ── Tab Router ────────────────────────────────────────────────────────────
  window._loadAdminTab = function(tabName) {
    switch (tabName) {
      case 'dashboard':
        loadDashboardStats();
        break;
      case 'users':
        loadUsers();
        break;
      case 'books':
        loadBooks();
        break;
      case 'marketplace':
        loadMarketplace();
        break;
      case 'exchanges':
        loadExchanges();
        break;
      case 'donations':
        loadDonations();
        break;
      case 'academic':
        loadColleges();
        break;
      case 'analytics':
        loadAnalytics();
        break;
      case 'audit-logs':
        loadAuditLogs();
        break;
      case 'notifications':
        loadNotifications();
        break;
      case 'system-health':
        loadSystemHealth();
        break;
      case 'admin-profile':
        loadAdminProfile();
        break;
      default:
        break;
    }
  };

  // ── 1. DASHBOARD OVERVIEW & CHARTS ────────────────────────────────────────
  async function loadDashboardStats() {
    try {
      const stats = await window.BookAPI.getAdminStats();
      document.getElementById('dashStatUsers').textContent = (stats.totalUsers || 0).toLocaleString('en-IN');
      document.getElementById('dashStatActiveUsers').textContent = (stats.activeUsers || 0).toLocaleString('en-IN');
      document.getElementById('dashStatBooks').textContent = (stats.totalListings || stats.totalBooks || 0).toLocaleString('en-IN');
      document.getElementById('dashStatAvailBooks').textContent = (stats.availableListings || stats.availableBooks || 0).toLocaleString('en-IN');
      document.getElementById('dashStatSwaps').textContent = (stats.activeSwaps || 0).toLocaleString('en-IN');
      document.getElementById('dashStatCompSwaps').textContent = (stats.completedSwaps || 0).toLocaleString('en-IN');
      document.getElementById('dashStatDonations').textContent = (stats.freeDonations || 0).toLocaleString('en-IN');
      document.getElementById('dashStatApprDonations').textContent = (stats.approvedDonations || 0).toLocaleString('en-IN');
      document.getElementById('dashStatColleges').textContent = (stats.totalColleges || 0).toLocaleString('en-IN');
      document.getElementById('dashStatDepartments').textContent = (stats.totalDepartments || 0).toLocaleString('en-IN');
      document.getElementById('dashStatCourses').textContent = (stats.totalCourses || 0).toLocaleString('en-IN');
      document.getElementById('dashLastUpdated').textContent = new Date().toLocaleTimeString();

      // Recent Activity
      const actBody = document.getElementById('dashRecentActivityBody');
      if (actBody && stats.recentActivity) {
        actBody.innerHTML = stats.recentActivity.map(a => `
          <tr>
            <td><span class="badge badge-primary">${escapeHtml(a.action || 'ACTIVITY')}</span></td>
            <td><strong>${escapeHtml(a.title || '')}</strong><br><span style="font-size:11.5px;color:var(--color-gray);">${escapeHtml(a.user_email || a.user_name || 'System')}</span></td>
            <td style="color:var(--color-gray);">${a.created_at ? new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</td>
          </tr>
        `).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--color-gray);padding:16px;">No recent activity.</td></tr>';
      }

      // Recent Users
      const usersBody = document.getElementById('dashRecentUsersBody');
      if (usersBody && stats.recentRegistrations) {
        usersBody.innerHTML = stats.recentRegistrations.map(u => `
          <tr>
            <td><strong>${escapeHtml(u.full_name || u.email)}</strong><br><span style="font-size:11.5px;color:var(--color-gray);">${escapeHtml(u.email)}</span></td>
            <td><span class="role-badge role-${(u.role || 'student').toLowerCase().replace('_', '-')}">${escapeHtml(u.role || 'STUDENT')}</span></td>
            <td><span class="status-pill ${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
            <td style="color:var(--color-gray);">${u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}</td>
          </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--color-gray);padding:16px;">No users registered yet.</td></tr>';
      }

      // Render Charts
      renderDashboardCharts(stats);
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to load dashboard statistics', 'danger');
    }
  }

  function renderDashboardCharts(stats) {
    if (typeof Chart === 'undefined') return;

    // 1. Department Distribution (Doughnut Chart)
    const branchCanvas = document.getElementById('dashBranchChartCanvas');
    if (branchCanvas) {
      if (_adminCharts.dashBranch) _adminCharts.dashBranch.destroy();
      const dist = stats.departmentDistribution || [];
      const labels = dist.length > 0 ? dist.map(d => d.branch || 'Other') : ['CE', 'IT', 'EE', 'ME', 'Civil'];
      const data = dist.length > 0 ? dist.map(d => d.count) : [0, 0, 0, 0, 0];

      _adminCharts.dashBranch = new Chart(branchCanvas, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'],
            borderWidth: 2,
            borderColor: '#ffffff',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
      });
    }

    // 2. Listing Mode Breakdown (Bar Chart)
    const typeCanvas = document.getElementById('dashTypeChartCanvas');
    if (typeCanvas) {
      if (_adminCharts.dashType) _adminCharts.dashType.destroy();
      const modes = stats.listingTypeBreakdown || [];
      const modeMap = { sell: 0, exchange: 0, donate: 0 };
      modes.forEach(m => {
        const k = (m.mode || '').toLowerCase();
        if (modeMap[k] !== undefined) modeMap[k] = m.count;
      });

      _adminCharts.dashType = new Chart(typeCanvas, {
        type: 'bar',
        data: {
          labels: ['For Sale', 'For Exchange', 'Free Donation'],
          datasets: [{
            label: 'Listings',
            data: [modeMap.sell, modeMap.exchange, modeMap.donate],
            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  }

  // ── 2. USERS MANAGEMENT ───────────────────────────────────────────────────
  let _usersCache = [];

  async function loadUsers() {
    const tbody = document.getElementById('adminUsersTableBody');
    const searchVal = document.getElementById('userSearchInput')?.value.trim();
    const roleVal = document.getElementById('userRoleFilter')?.value;
    const statusVal = document.getElementById('userStatusFilter')?.value;

    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading registered users...</td></tr>';

    try {
      const filters = {};
      if (searchVal) filters.search = searchVal;
      if (roleVal) filters.role = roleVal;
      if (statusVal === 'active') filters.is_active = 'true';
      else if (statusVal === 'inactive') filters.is_active = 'false';

      _usersCache = await window.BookAPI.getAdminUsers(filters);
      document.getElementById('usersResultCount').textContent = `${_usersCache.length} Users`;

      if (!tbody) return;
      tbody.innerHTML = _usersCache.map(u => {
        const roleClass = `role-${(u.role || 'student').toLowerCase().replace('_', '-')}`;
        const activeStatus = u.is_active ? 'active' : 'inactive';
        const activeLabel = u.is_active ? 'Active' : 'Inactive';

        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:34px;height:34px;border-radius:50%;background:var(--color-primary-light);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">
                  ${(u.full_name || u.name || u.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>${escapeHtml(u.full_name || u.name || 'User')}</strong>
                  ${u.enrollment_number ? `<br><span style="font-size:11.5px;color:var(--color-gray);">${escapeHtml(u.enrollment_number)}</span>` : ''}
                </div>
              </div>
            </td>
            <td style="font-size:13px;">${escapeHtml(u.email)}</td>
            <td style="font-size:12.5px;">${escapeHtml(u.department_name || u.college_name || 'Academic')}</td>
            <td><span class="role-badge ${roleClass}">${escapeHtml(u.role || 'STUDENT')}</span></td>
            <td><span class="status-pill ${activeStatus}">${activeLabel}</span></td>
            <td style="font-size:12px;color:var(--color-gray);">${u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}</td>
            <td style="text-align: right;">
              <div class="action-btn-group">
                <button class="action-btn" title="View Full Details" onclick="window.inspectUser('${u.id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn" title="${u.is_active ? 'Deactivate' : 'Activate'}" onclick="window.toggleUserActive('${u.id}', ${u.is_active})">
                  <i class="fa-solid ${u.is_active ? 'fa-ban' : 'fa-check'}" style="color:${u.is_active ? '#dc2626' : '#16a34a'};"></i>
                </button>
                <button class="action-btn" title="Assign Role" onclick="window.openRoleModal('${u.id}', '${escapeHtml(u.full_name || u.name || u.email)}', '${escapeHtml(u.email)}', '${u.role}')"><i class="fa-solid fa-user-gear"></i></button>
                <button class="action-btn danger" title="Delete Account" onclick="window.deleteUser('${u.id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-gray);">No users match your filters.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-danger);">${escapeHtml(err.message || 'Failed to load users.')}</td></tr>`;
    }
  }

  // User Inspectors & Actions
  window.inspectUser = async function(id) {
    const modal = document.getElementById('adminUserDetailsModal');
    const modalBody = document.getElementById('adminUserModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = '<div style="text-align:center;padding:32px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top:12px;">Loading user profile & history...</p></div>';
    modal.classList.add('active');

    try {
      const u = await window.BookAPI.getAdminUserDetail(id);
      modalBody.innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--color-border);">
          <div style="width:54px;height:54px;border-radius:50%;background:var(--color-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">
            ${(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style="margin-bottom:4px;">${escapeHtml(u.full_name || u.email)}</h3>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="role-badge role-${(u.role || 'student').toLowerCase().replace('_', '-')}">${escapeHtml(u.role)}</span>
              <span class="status-pill ${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span>
              ${u.is_college_verified ? '<span class="badge badge-success"><i class="fa-solid fa-certificate"></i> Verified</span>' : ''}
            </div>
          </div>
        </div>

        <div class="grid-3" style="margin-bottom:20px;text-align:center;">
          <div class="card" style="padding:12px;background:var(--color-bg);">
            <div style="font-size:18px;font-weight:700;">${u.books_count || 0}</div>
            <div style="font-size:11.5px;color:var(--color-gray);">Books Listed</div>
          </div>
          <div class="card" style="padding:12px;background:var(--color-bg);">
            <div style="font-size:18px;font-weight:700;">${u.exchanges_count || 0}</div>
            <div style="font-size:11.5px;color:var(--color-gray);">Exchanges</div>
          </div>
          <div class="card" style="padding:12px;background:var(--color-bg);">
            <div style="font-size:18px;font-weight:700;">${u.donations_count || 0}</div>
            <div style="font-size:11.5px;color:var(--color-gray);">Donations</div>
          </div>
        </div>

        <div style="margin-bottom:16px;font-size:13.5px;">
          <div><strong>Email:</strong> ${escapeHtml(u.email)}</div>
          <div><strong>Phone:</strong> ${escapeHtml(u.phone_number || 'Not provided')}</div>
          <div><strong>College:</strong> ${escapeHtml(u.college_name || 'N/A')}</div>
          <div><strong>Department:</strong> ${escapeHtml(u.department_name || 'N/A')} (Sem ${u.semester || 1})</div>
          <div><strong>Enrollment:</strong> ${escapeHtml(u.enrollment_number || 'N/A')}</div>
          <div><strong>Joined Date:</strong> ${u.date_joined ? new Date(u.date_joined).toLocaleString() : 'N/A'}</div>
          <div><strong>Last Login:</strong> ${u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</div>
        </div>

        <h4 style="margin-top:16px;margin-bottom:8px;font-size:14px;"><i class="fa-solid fa-book"></i> Recent Listed Books</h4>
        <div class="data-table-wrap" style="margin-bottom:16px;">
          <table class="data-table" style="font-size:12px;">
            <thead><tr><th>Title</th><th>Mode</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>
              ${(u.recent_books || []).map(b => `
                <tr>
                  <td><strong>${escapeHtml(b.title)}</strong></td>
                  <td>${escapeHtml(b.mode)}</td>
                  <td>${b.price > 0 ? '₹' + b.price : 'Free'}</td>
                  <td><span class="status-pill ${(b.status||'available').toLowerCase()}">${escapeHtml(b.status)}</span></td>
                </tr>
              `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--color-gray);padding:10px;">No listed books</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      modalBody.innerHTML = `<div style="color:var(--color-danger);padding:24px;text-align:center;">Failed to load user details: ${escapeHtml(err.message)}</div>`;
    }
  };

  window.toggleUserActive = async function(id, currentActive) {
    const actionName = currentActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionName} this user account?`)) return;
    try {
      await window.BookAPI.toggleUserStatus(id, !currentActive);
      if (typeof showToast === 'function') showToast(`User account ${actionName}d successfully`, 'success');
      loadUsers();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Operation failed', 'danger');
    }
  };

  window.openRoleModal = function(id, name, email, currentRole) {
    const modal = document.getElementById('adminUserRoleModal');
    if (!modal) return;
    document.getElementById('roleModalUserId').value = id;
    document.getElementById('roleModalUserName').textContent = name;
    document.getElementById('roleModalUserEmail').textContent = email;
    document.getElementById('roleModalSelect').value = currentRole || 'STUDENT';
    modal.classList.add('active');
  };

  window.deleteUser = async function(id) {
    if (!confirm('CAUTION: Are you sure you want to permanently delete this user account? This action cannot be undone.')) return;
    try {
      await window.BookAPI.deleteAdminUser(id);
      if (typeof showToast === 'function') showToast('User deleted successfully', 'success');
      loadUsers();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to delete user', 'danger');
    }
  };

  // Role form submit
  document.getElementById('adminUserRoleForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('roleModalUserId').value;
    const newRole = document.getElementById('roleModalSelect').value;
    try {
      await window.BookAPI.updateUserRole(id, newRole);
      if (typeof showToast === 'function') showToast(`User role updated to ${newRole}`, 'success');
      document.getElementById('adminUserRoleModal')?.classList.remove('active');
      loadUsers();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to update role', 'danger');
    }
  });

  // Filter Event Listeners for Users
  let userSearchTimeout = null;
  document.getElementById('userSearchInput')?.addEventListener('input', () => {
    clearTimeout(userSearchTimeout);
    userSearchTimeout = setTimeout(loadUsers, 300);
  });
  document.getElementById('userRoleFilter')?.addEventListener('change', loadUsers);
  document.getElementById('userStatusFilter')?.addEventListener('change', loadUsers);
  document.getElementById('btnRefreshUsers')?.addEventListener('click', loadUsers);

  // ── 3. BOOKS MANAGEMENT ───────────────────────────────────────────────────
  let _booksCache = [];

  async function loadBooks() {
    const tbody = document.getElementById('adminBooksTableBody');
    const searchVal = document.getElementById('bookSearchInput')?.value.trim();
    const branchVal = document.getElementById('bookBranchFilter')?.value;
    const modeVal = document.getElementById('bookModeFilter')?.value;
    const statusVal = document.getElementById('bookStatusFilter')?.value;

    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading catalog...</td></tr>';

    try {
      const filters = {};
      if (searchVal) filters.search = searchVal;
      if (branchVal) filters.branch = branchVal;
      if (modeVal) filters.mode = modeVal;
      if (statusVal) filters.status = statusVal;

      _booksCache = await window.BookAPI.getAdminBooks(filters);
      document.getElementById('booksResultCount').textContent = `${_booksCache.length} Books`;

      if (!tbody) return;
      tbody.innerHTML = _booksCache.map(b => {
        const modeBadgeClass = b.mode === 'sell' ? 'badge-primary' : (b.mode === 'exchange' ? 'badge-warning' : 'badge-success');
        const statusClass = (b.status || 'available').toLowerCase();

        return `
          <tr>
            <td><span style="font-weight:700;color:var(--color-primary);">${escapeHtml(b.gtu_code || b.gtuCode || b.id)}</span></td>
            <td>
              <strong>${escapeHtml(b.title)}</strong><br>
              <span style="font-size:12px;color:var(--color-gray);">${escapeHtml(b.author || 'Unknown')} • Listed by ${escapeHtml(b.seller?.name || b.seller_name || 'Anonymous')}</span>
            </td>
            <td><span class="badge badge-secondary">${escapeHtml(b.branch || 'CE')} • Sem ${b.semester || 1}</span></td>
            <td><span class="badge ${modeBadgeClass}">${(b.mode || 'sell').toUpperCase()}</span></td>
            <td>${b.price > 0 ? '₹' + b.price : 'Free'}</td>
            <td><span class="status-pill ${statusClass}">${escapeHtml(b.status || 'Available')}</span></td>
            <td style="text-align: right;">
              <div class="action-btn-group">
                <button class="action-btn" title="View Book" onclick="window.viewBookDetails('${b.id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="action-btn" title="Edit Book" onclick="window.openEditBookModal('${b.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn danger" title="Delete Listing" onclick="window.handleDeleteAdminBook('${b.id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-gray);">No books match your criteria.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-danger);">${escapeHtml(err.message || 'Failed to load books catalog.')}</td></tr>`;
    }
  }

  window.openEditBookModal = function(id) {
    const book = _booksCache.find(b => String(b.id) === String(id));
    if (!book) return;
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author || '';
    document.getElementById('editBookBranch').value = book.branch || 'CE';
    document.getElementById('editBookPrice').value = book.price || 0;
    document.getElementById('editBookStatus').value = book.status || 'Available';
    document.getElementById('editBookCondition').value = book.condition || 'Good';
    document.getElementById('adminEditBookModal')?.classList.add('active');
  };

  document.getElementById('adminEditBookForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editBookId').value;
    const payload = {
      title: document.getElementById('editBookTitle').value.trim(),
      author: document.getElementById('editBookAuthor').value.trim(),
      branch: document.getElementById('editBookBranch').value,
      price: parseFloat(document.getElementById('editBookPrice').value) || 0,
      status: document.getElementById('editBookStatus').value,
      condition: document.getElementById('editBookCondition').value,
    };
    try {
      await window.BookAPI.updateAdminBook(id, payload);
      if (typeof showToast === 'function') showToast('Book listing updated successfully', 'success');
      document.getElementById('adminEditBookModal')?.classList.remove('active');
      loadBooks();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to update book', 'danger');
    }
  });

  window.handleDeleteAdminBook = async function(id) {
    if (!confirm('Are you sure you want to remove this book listing from the catalog?')) return;
    try {
      await window.BookAPI.deleteAdminBook(id);
      if (typeof showToast === 'function') showToast('Book listing deleted successfully', 'success');
      loadBooks();
      loadDashboardStats();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to delete listing', 'danger');
    }
  };

  // Add Book Form Handlers
  document.getElementById('btnAdminAddBook')?.addEventListener('click', () => {
    document.getElementById('adminAddBookModal')?.classList.add('active');
  });
  document.getElementById('closeAdminAddBookModal')?.addEventListener('click', () => {
    document.getElementById('adminAddBookModal')?.classList.remove('active');
  });
  document.getElementById('closeAdminEditBookModal')?.addEventListener('click', () => {
    document.getElementById('adminEditBookModal')?.classList.remove('active');
  });
  document.getElementById('closeAdminUserDetailsModal')?.addEventListener('click', () => {
    document.getElementById('adminUserDetailsModal')?.classList.remove('active');
  });
  document.getElementById('closeAdminUserRoleModal')?.addEventListener('click', () => {
    document.getElementById('adminUserRoleModal')?.classList.remove('active');
  });

  document.getElementById('adminAddBookForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById('adminBookTitle').value.trim(),
      author: document.getElementById('adminBookAuthor').value.trim(),
      branch: document.getElementById('adminBookBranch').value,
      semester: parseInt(document.getElementById('adminBookSemester').value, 10),
      gtu_code: document.getElementById('adminBookGtuCode').value.trim(),
      condition: document.getElementById('adminBookCondition').value,
      mode: document.getElementById('adminBookMode').value,
      price: parseFloat(document.getElementById('adminBookPrice').value) || 0,
      description: document.getElementById('adminBookDesc').value.trim(),
    };
    try {
      await window.BookAPI.addBook(payload);
      if (typeof showToast === 'function') showToast('Book added to catalog successfully', 'success');
      document.getElementById('adminAddBookModal')?.classList.remove('active');
      document.getElementById('adminAddBookForm').reset();
      loadBooks();
      loadDashboardStats();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to add book', 'danger');
    }
  });

  let bookSearchTimeout = null;
  document.getElementById('bookSearchInput')?.addEventListener('input', () => {
    clearTimeout(bookSearchTimeout);
    bookSearchTimeout = setTimeout(loadBooks, 300);
  });
  document.getElementById('bookBranchFilter')?.addEventListener('change', loadBooks);
  document.getElementById('bookModeFilter')?.addEventListener('change', loadBooks);
  document.getElementById('bookStatusFilter')?.addEventListener('change', loadBooks);

  // ── 4. MARKETPLACE MANAGEMENT ─────────────────────────────────────────────
  async function loadMarketplace() {
    const tbody = document.getElementById('adminMarketplaceTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading marketplace listings...</td></tr>';
    try {
      const books = await window.BookAPI.getAdminBooks();
      if (!tbody) return;
      tbody.innerHTML = books.map(b => `
        <tr>
          <td><span style="font-family:monospace;font-size:12px;color:var(--color-primary);">${b.id}</span></td>
          <td><strong>${escapeHtml(b.title)}</strong><br><span style="font-size:12px;color:var(--color-gray);">${escapeHtml(b.author || '')}</span></td>
          <td>${escapeHtml(b.seller?.name || b.seller_name || 'Seller')}</td>
          <td><span class="badge badge-primary">${(b.mode || 'sell').toUpperCase()}</span></td>
          <td>${escapeHtml(b.condition || 'Good')}</td>
          <td>${b.price > 0 ? '₹' + b.price : 'Free'}</td>
          <td><span class="status-pill ${(b.status || 'available').toLowerCase()}">${escapeHtml(b.status || 'Available')}</span></td>
          <td style="text-align: right;">
            <button class="action-btn" title="View Book" onclick="window.viewBookDetails('${b.id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="action-btn danger" title="Remove Listing" onclick="window.handleDeleteAdminBook('${b.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-gray);">No marketplace listings found.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-danger);">${escapeHtml(err.message || 'Failed to load marketplace.')}</td></tr>`;
    }
  }
  document.getElementById('btnRefreshMarketplace')?.addEventListener('click', loadMarketplace);

  // ── 5. EXCHANGES MANAGEMENT ───────────────────────────────────────────────
  async function loadExchanges() {
    const tbody = document.getElementById('adminExchangesTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading exchanges...</td></tr>';
    try {
      const exchanges = await window.BookAPI.getAdminExchanges();
      if (!tbody) return;
      tbody.innerHTML = exchanges.map(ex => {
        const statusClass = (ex.status || 'pending').toLowerCase();
        const shortId = String(ex.id).slice(0, 8);
        return `
          <tr>
            <td><span style="font-family:monospace;font-size:12px;font-weight:700;">#${shortId}</span></td>
            <td><strong>${escapeHtml(ex.target_book_title || ex.target_book?.title || 'Unknown Book')}</strong></td>
            <td>${escapeHtml(ex.proposer_name || ex.proposer?.full_name || 'Student')}</td>
            <td>${escapeHtml(ex.seller_name || ex.target_book?.seller?.full_name || 'Owner')}</td>
            <td>${escapeHtml(ex.offered_book_title || ex.offered_book?.title || 'None Specified')}</td>
            <td><span class="status-pill ${statusClass}">${escapeHtml(ex.status || 'pending')}</span></td>
            <td style="font-size:12px;color:var(--color-gray);">${ex.created_at ? new Date(ex.created_at).toLocaleDateString() : 'N/A'}</td>
            <td style="text-align: right;">
              <select class="admin-filter-select" style="height:28px;padding:0 6px;font-size:11.5px;" onchange="window.updateExchangeStatus('${ex.id}', this.value)">
                <option value="pending" ${ex.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="accepted" ${ex.status === 'accepted' ? 'selected' : ''}>Accept</option>
                <option value="completed" ${ex.status === 'completed' ? 'selected' : ''}>Complete</option>
                <option value="rejected" ${ex.status === 'rejected' ? 'selected' : ''}>Reject</option>
                <option value="cancelled" ${ex.status === 'cancelled' ? 'selected' : ''}>Cancel</option>
              </select>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-gray);">No exchange proposals found.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-danger);">${escapeHtml(err.message || 'Failed to load exchanges.')}</td></tr>`;
    }
  }

  window.updateExchangeStatus = async function(id, newStatus) {
    try {
      await window.BookAPI.updateExchangeStatus(id, newStatus);
      if (typeof showToast === 'function') showToast(`Exchange status updated to ${newStatus}`, 'success');
      loadExchanges();
      loadDashboardStats();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to update exchange', 'danger');
    }
  };
  document.getElementById('btnRefreshExchanges')?.addEventListener('click', loadExchanges);

  // ── 6. DONATIONS MANAGEMENT ───────────────────────────────────────────────
  async function loadDonations() {
    const tbody = document.getElementById('adminDonationsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading donation claims...</td></tr>';
    try {
      const donations = await window.BookAPI.getAdminDonations();
      if (!tbody) return;
      tbody.innerHTML = donations.map(d => {
        const statusClass = (d.status || 'pending').toLowerCase();
        return `
          <tr>
            <td><span style="font-family:monospace;font-size:12px;font-weight:700;">#${d.id}</span></td>
            <td><strong>${escapeHtml(d.book_title || d.book?.title || 'Donated Resource')}</strong></td>
            <td>${escapeHtml(d.seller_name || d.book?.seller?.full_name || 'Donor')}</td>
            <td>${escapeHtml(d.claimer_name || d.claimer?.full_name || 'Claimer')}</td>
            <td style="font-size:12px;color:var(--color-gray);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(d.message || 'No message')}</td>
            <td><span class="status-pill ${statusClass}">${escapeHtml(d.status || 'pending')}</span></td>
            <td style="font-size:12px;color:var(--color-gray);">${d.created_at ? new Date(d.created_at).toLocaleDateString() : 'N/A'}</td>
            <td style="text-align: right;">
              <select class="admin-filter-select" style="height:28px;padding:0 6px;font-size:11.5px;" onchange="window.updateDonationStatus('${d.id}', this.value)">
                <option value="pending" ${d.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="approved" ${d.status === 'approved' ? 'selected' : ''}>Approve</option>
                <option value="completed" ${d.status === 'completed' ? 'selected' : ''}>Complete</option>
                <option value="rejected" ${d.status === 'rejected' ? 'selected' : ''}>Reject</option>
              </select>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-gray);">No donation claims found.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--color-danger);">${escapeHtml(err.message || 'Failed to load donations.')}</td></tr>`;
    }
  }

  window.updateDonationStatus = async function(id, newStatus) {
    try {
      await window.BookAPI.updateDonationStatus(id, newStatus);
      if (typeof showToast === 'function') showToast(`Donation claim status updated to ${newStatus}`, 'success');
      loadDonations();
      loadDashboardStats();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to update donation', 'danger');
    }
  };
  document.getElementById('btnRefreshDonations')?.addEventListener('click', loadDonations);

  // ── 7. ACADEMIC STRUCTURE (Colleges / Depts / Courses) ─────────────────────
  let _collegesList = [];
  let _deptsList = [];

  async function loadColleges() {
    const tbody = document.getElementById('academicCollegesBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading colleges...</td></tr>';
    try {
      _collegesList = await window.BookAPI.getColleges();
      if (!tbody) return;
      tbody.innerHTML = _collegesList.map(c => `
        <tr>
          <td><span style="font-weight:700;color:var(--color-primary);">${escapeHtml(c.code)}</span></td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td>${escapeHtml(c.city || 'Gujarat')}</td>
          <td>${escapeHtml(c.state || 'Gujarat')}</td>
          <td><span class="status-pill ${c.is_active ? 'active' : 'inactive'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
          <td style="text-align: right;">
            <button class="action-btn danger" title="Delete College" onclick="window.deleteCollege('${c.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--color-gray);">No colleges registered.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--color-danger);">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function loadDepartments() {
    const tbody = document.getElementById('academicDepartmentsBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading departments...</td></tr>';
    try {
      _deptsList = await window.BookAPI.getDepartments();
      if (!tbody) return;
      tbody.innerHTML = _deptsList.map(d => `
        <tr>
          <td><span style="font-weight:700;color:var(--color-primary);">${escapeHtml(d.code)}</span></td>
          <td><strong>${escapeHtml(d.name)}</strong></td>
          <td>${escapeHtml(d.college_name || 'RCTI')}</td>
          <td style="text-align: right;">
            <button class="action-btn danger" title="Delete Department" onclick="window.deleteDepartment('${d.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--color-gray);">No departments found.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--color-danger);">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function loadCourses() {
    const tbody = document.getElementById('academicCoursesBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading courses...</td></tr>';
    try {
      const courses = await window.BookAPI.getCourses();
      if (!tbody) return;
      tbody.innerHTML = courses.map(c => `
        <tr>
          <td><span style="font-weight:700;color:var(--color-primary);">${escapeHtml(c.code)}</span></td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td>${escapeHtml(c.department_name || c.department?.name || 'Computer')}</td>
          <td>Semester ${c.semester || 1}</td>
          <td style="text-align: right;">
            <button class="action-btn danger" title="Delete Course" onclick="window.deleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-gray);">No courses found.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-danger);">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // Academic Modals & Actions
  document.getElementById('btnAddCollege')?.addEventListener('click', () => {
    document.getElementById('adminAddCollegeModal')?.classList.add('active');
  });
  document.getElementById('closeAddCollegeModal')?.addEventListener('click', () => {
    document.getElementById('adminAddCollegeModal')?.classList.remove('active');
  });
  document.getElementById('adminAddCollegeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('newCollegeName').value.trim(),
      code: document.getElementById('newCollegeCode').value.trim(),
      city: document.getElementById('newCollegeCity').value.trim(),
      state: document.getElementById('newCollegeState').value.trim(),
    };
    try {
      await window.BookAPI.createCollege(payload);
      if (typeof showToast === 'function') showToast('College added successfully', 'success');
      document.getElementById('adminAddCollegeModal')?.classList.remove('active');
      document.getElementById('adminAddCollegeForm').reset();
      loadColleges();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to add college', 'danger');
    }
  });
  window.deleteCollege = async function(id) {
    if (!confirm('Are you sure you want to delete this college?')) return;
    try {
      await window.BookAPI.deleteCollege(id);
      if (typeof showToast === 'function') showToast('College deleted successfully', 'success');
      loadColleges();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to delete college', 'danger');
    }
  };

  document.getElementById('btnAddDepartment')?.addEventListener('click', async () => {
    const select = document.getElementById('newDeptCollegeSelect');
    if (select) {
      if (_collegesList.length === 0) _collegesList = await window.BookAPI.getColleges();
      select.innerHTML = _collegesList.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.code})</option>`).join('');
    }
    document.getElementById('adminAddDeptModal')?.classList.add('active');
  });
  document.getElementById('closeAddDeptModal')?.addEventListener('click', () => {
    document.getElementById('adminAddDeptModal')?.classList.remove('active');
  });
  document.getElementById('adminAddDeptForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      college: document.getElementById('newDeptCollegeSelect').value,
      name: document.getElementById('newDeptName').value.trim(),
      code: document.getElementById('newDeptCode').value.trim().toUpperCase(),
    };
    try {
      await window.BookAPI.createDepartment(payload);
      if (typeof showToast === 'function') showToast('Department added successfully', 'success');
      document.getElementById('adminAddDeptModal')?.classList.remove('active');
      document.getElementById('adminAddDeptForm').reset();
      loadDepartments();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to add department', 'danger');
    }
  });
  window.deleteDepartment = async function(id) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await window.BookAPI.deleteDepartment(id);
      if (typeof showToast === 'function') showToast('Department deleted successfully', 'success');
      loadDepartments();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to delete department', 'danger');
    }
  };

  document.getElementById('btnAddCourse')?.addEventListener('click', async () => {
    const select = document.getElementById('newCourseDeptSelect');
    if (select) {
      if (_deptsList.length === 0) _deptsList = await window.BookAPI.getDepartments();
      select.innerHTML = _deptsList.map(d => `<option value="${d.id}">${escapeHtml(d.name)} (${d.code})</option>`).join('');
    }
    document.getElementById('adminAddCourseModal')?.classList.add('active');
  });
  document.getElementById('closeAddCourseModal')?.addEventListener('click', () => {
    document.getElementById('adminAddCourseModal')?.classList.remove('active');
  });
  document.getElementById('adminAddCourseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      department: document.getElementById('newCourseDeptSelect').value,
      name: document.getElementById('newCourseName').value.trim(),
      code: document.getElementById('newCourseCode').value.trim(),
      semester: parseInt(document.getElementById('newCourseSemester').value, 10),
    };
    try {
      await window.BookAPI.createCourse(payload);
      if (typeof showToast === 'function') showToast('Course added successfully', 'success');
      document.getElementById('adminAddCourseModal')?.classList.remove('active');
      document.getElementById('adminAddCourseForm').reset();
      loadCourses();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to add course', 'danger');
    }
  });
  window.deleteCourse = async function(id) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await window.BookAPI.deleteCourse(id);
      if (typeof showToast === 'function') showToast('Course deleted successfully', 'success');
      loadCourses();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to delete course', 'danger');
    }
  };

  // ── 8. ANALYTICS DEEP DIVE ────────────────────────────────────────────────
  async function loadAnalytics() {
    try {
      const data = await window.BookAPI.getAdminAnalytics();

      // 1. Monthly Trends
      const growthCanvas = document.getElementById('analyticsGrowthChartCanvas');
      if (growthCanvas && data.monthlyTrends) {
        if (_adminCharts.analyticsGrowth) _adminCharts.analyticsGrowth.destroy();
        _adminCharts.analyticsGrowth = new Chart(growthCanvas, {
          type: 'line',
          data: {
            labels: data.monthlyTrends.map(m => m.month),
            datasets: [
              {
                label: 'New Users',
                data: data.monthlyTrends.map(m => m.users),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.3,
                fill: true,
              },
              {
                label: 'New Listings',
                data: data.monthlyTrends.map(m => m.books),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: true,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }

      // 2. Top Colleges
      const collegesCanvas = document.getElementById('analyticsCollegesChartCanvas');
      if (collegesCanvas && data.topColleges) {
        if (_adminCharts.analyticsColleges) _adminCharts.analyticsColleges.destroy();
        _adminCharts.analyticsColleges = new Chart(collegesCanvas, {
          type: 'bar',
          data: {
            labels: data.topColleges.map(c => c.code || c.name),
            datasets: [{
              label: 'Enrolled Students',
              data: data.topColleges.map(c => c.students_count),
              backgroundColor: '#0284c7',
              borderRadius: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }

      // 3. Condition Breakdown
      const conditionCanvas = document.getElementById('analyticsConditionChartCanvas');
      if (conditionCanvas && data.conditionBreakdown) {
        if (_adminCharts.analyticsCondition) _adminCharts.analyticsCondition.destroy();
        _adminCharts.analyticsCondition = new Chart(conditionCanvas, {
          type: 'pie',
          data: {
            labels: data.conditionBreakdown.map(c => c.condition || 'Good'),
            datasets: [{
              data: data.conditionBreakdown.map(c => c.count),
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      // 4. Swap Fulfillment Rate
      if (data.exchangeStats) {
        document.getElementById('analyticsSwapRate').textContent = `${data.exchangeStats.successRate}%`;
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to load analytics', 'danger');
    }
  }
  document.getElementById('btnRefreshAnalytics')?.addEventListener('click', loadAnalytics);

  // ── 9. AUDIT LOGS ─────────────────────────────────────────────────────────
  let _logsCache = [];

  async function loadAuditLogs() {
    const tbody = document.getElementById('adminAuditLogsTableBody');
    const searchVal = document.getElementById('auditSearchInput')?.value.trim();
    const actionVal = document.getElementById('auditActionFilter')?.value;

    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading audit logs...</td></tr>';

    try {
      const filters = {};
      if (searchVal) filters.search = searchVal;
      if (actionVal) filters.action = actionVal;

      _logsCache = await window.BookAPI.getAuditLogs(filters);
      document.getElementById('auditLogsResultCount').textContent = `${_logsCache.length} Logs`;

      if (!tbody) return;
      tbody.innerHTML = _logsCache.map((l, idx) => `
        <tr>
          <td><span class="badge badge-primary">${escapeHtml(l.action)}</span></td>
          <td><strong>${escapeHtml(l.title)}</strong></td>
          <td style="font-size:12.5px;">${escapeHtml(l.user_email || l.user_name || 'Anonymous')}</td>
          <td style="font-family:monospace;font-size:12px;color:var(--color-gray);">${escapeHtml(l.ip_address || '127.0.0.1')}</td>
          <td style="font-size:12px;color:var(--color-gray);">${l.created_at ? new Date(l.created_at).toLocaleString() : 'N/A'}</td>
          <td style="text-align: right;">
            <button class="action-btn" title="Inspect Telemetry" onclick="window.inspectAuditLog(${idx})"><i class="fa-solid fa-code"></i></button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-gray);">No audit logs found.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--color-danger);">${escapeHtml(err.message || 'Failed to load logs.')}</td></tr>`;
    }
  }

  window.inspectAuditLog = function(idx) {
    const log = _logsCache[idx];
    if (!log) return;
    const modal = document.getElementById('adminAuditMetaModal');
    const body = document.getElementById('auditMetaBody');
    if (!modal || !body) return;
    body.textContent = JSON.stringify(log, null, 2);
    modal.classList.add('active');
  };
  document.getElementById('closeAuditMetaModal')?.addEventListener('click', () => {
    document.getElementById('adminAuditMetaModal')?.classList.remove('active');
  });

  let auditSearchTimeout = null;
  document.getElementById('auditSearchInput')?.addEventListener('input', () => {
    clearTimeout(auditSearchTimeout);
    auditSearchTimeout = setTimeout(loadAuditLogs, 300);
  });
  document.getElementById('auditActionFilter')?.addEventListener('change', loadAuditLogs);
  document.getElementById('btnRefreshAuditLogs')?.addEventListener('click', loadAuditLogs);

  // ── 10. NOTIFICATIONS & BROADCAST ─────────────────────────────────────────
  async function loadNotifications() {
    const tbody = document.getElementById('adminNotificationsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--color-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading notifications...</td></tr>';
    try {
      const data = await window.BookAPI.getNotifications();
      const list = data.notifications || [];
      if (!tbody) return;
      tbody.innerHTML = list.map(n => `
        <tr>
          <td><strong>${escapeHtml(n.title)}</strong><br><span style="font-size:12px;color:var(--color-gray);">${escapeHtml(n.message || '')}</span></td>
          <td>${escapeHtml(n.recipient_email || 'Recipient')}</td>
          <td><span class="badge badge-secondary">${escapeHtml(n.notification_type || 'SYSTEM')}</span></td>
          <td><span class="status-pill ${n.is_read ? 'completed' : 'pending'}">${n.is_read ? 'Read' : 'Unread'}</span></td>
          <td style="font-size:12px;color:var(--color-gray);">${n.created_at ? new Date(n.created_at).toLocaleString() : 'N/A'}</td>
        </tr>
      `).join('') || '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--color-gray);">No recent notifications.</td></tr>';
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--color-danger);">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  document.getElementById('btnOpenBroadcastModal')?.addEventListener('click', () => {
    document.getElementById('adminBroadcastModal')?.classList.add('active');
  });
  document.getElementById('closeBroadcastModal')?.addEventListener('click', () => {
    document.getElementById('adminBroadcastModal')?.classList.remove('active');
  });
  document.getElementById('adminBroadcastForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById('broadcastTitle').value.trim(),
      message: document.getElementById('broadcastMessage').value.trim(),
      target: document.getElementById('broadcastTarget').value,
    };
    try {
      const res = await window.BookAPI.broadcastNotification(payload);
      if (typeof showToast === 'function') showToast(res.message || 'Broadcast announcement sent', 'success');
      document.getElementById('adminBroadcastModal')?.classList.remove('active');
      document.getElementById('adminBroadcastForm').reset();
      loadNotifications();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Broadcast failed', 'danger');
    }
  });

  // ── 11. SYSTEM HEALTH ─────────────────────────────────────────────────────
  async function loadSystemHealth() {
    try {
      const health = await window.BookAPI.getAdminSystemHealth();
      const isHealthy = health.status === 'HEALTHY';

      const dbBadge = document.getElementById('healthDbBadge');
      if (dbBadge) {
        dbBadge.className = `health-status-badge ${isHealthy ? 'healthy' : 'degraded'}`;
        dbBadge.innerHTML = `<i class="fa-solid ${isHealthy ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${isHealthy ? 'Connected' : 'Degraded'}`;
      }

      document.getElementById('healthDbVendor').textContent = health.database?.vendor ? `${health.database.vendor.toUpperCase()} DB Engine` : 'MySQL Engine';
      document.getElementById('healthDbLatency').textContent = `${health.database?.latency_ms || 1.2} ms`;
      document.getElementById('healthEnv').textContent = health.engine?.environment || 'Production Ready';

      if (health.counts) {
        document.getElementById('healthCountUsers').textContent = health.counts.users || 0;
        document.getElementById('healthCountBooks').textContent = health.counts.books || 0;
        document.getElementById('healthCountColleges').textContent = health.counts.colleges || 0;
        document.getElementById('healthCountLogs').textContent = health.counts.activity_logs || 0;
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to fetch health check', 'danger');
    }
  }
  document.getElementById('btnRefreshHealth')?.addEventListener('click', loadSystemHealth);

  // ── 12. ADMIN PROFILE ─────────────────────────────────────────────────────
  function loadAdminProfile() {
    if (!currentUser) return;
    document.getElementById('profAdminName').textContent = currentUser.full_name || currentUser.name || 'Administrator';
    document.getElementById('profAdminEmail').textContent = currentUser.email || '';
    document.getElementById('profAdminRoleBadge').textContent = currentUser.role || 'SUPER_ADMIN';
    document.getElementById('profInputName').value = currentUser.full_name || currentUser.name || '';
    document.getElementById('profInputEmail').value = currentUser.email || '';
    document.getElementById('profInputPhone').value = currentUser.phone_number || '';
    document.getElementById('profInputJoined').value = currentUser.date_joined ? new Date(currentUser.date_joined).toLocaleDateString() : 'Active Member';
  }

  document.getElementById('adminProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('profInputName').value.trim();
    const newPhone = document.getElementById('profInputPhone').value.trim();
    try {
      await _patch('/profile/', { full_name: newName, phone_number: newPhone });
      if (typeof showToast === 'function') showToast('Admin profile updated successfully', 'success');
      const updatedUser = await window.BookAPI.getCurrentUser();
      const navName = document.getElementById('adminNavName');
      if (navName && updatedUser) navName.textContent = `${updatedUser.full_name || updatedUser.name} (${updatedUser.role || 'Admin'})`;
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to update profile', 'danger');
    }
  });

  // ── Global Dashboard Refresh Handlers ─────────────────────────────────────
  document.getElementById('btnRefreshDashboard')?.addEventListener('click', loadDashboardStats);
  document.getElementById('btnGlobalRefresh')?.addEventListener('click', () => {
    loadDashboardStats();
    if (typeof showToast === 'function') showToast('Dashboard refreshed with latest database records', 'info');
  });

  // Initial Load
  loadDashboardStats();
}

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
