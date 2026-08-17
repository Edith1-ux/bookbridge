/**
 * ==========================================================================
 * BOOKBRIDGE PREMIUM APPLICATION CONTROLLER
 * Handles all page logic, components, animations, and UI interactions
 * Version 2.0 — Aug 2026
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  initGlobalComponents();
  await updateNavUserUI();
  initLanguageSwitcher();
  registerPWA();

  const path = window.location.pathname;
  if (path.includes('admin')) initAdminPage();
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
    home: 'Home', browse: 'Browse', exchange: 'Exchange', donate: 'Donate', about: 'About', contact: 'Contact',
    welcome: 'Bridge Books. Build Minds.', upload: 'Upload Book', login: 'Login', register: 'Get Started',
    verified: 'Verified Student'
  },
  gu: {
    home: 'હોમ', browse: 'બ્રાઉઝ કરો', exchange: 'એક્સચેન્જ', donate: 'દાન કરો', about: 'અમારા વિશે', contact: 'સંપર્ક',
    welcome: 'પુસ્તકો જોડો. મન બનાવો.', upload: 'અપલોડ કરો', login: 'લોગિન', register: 'શરૂ કરો',
    verified: 'પ્રમાણિત વિદ્યાર્થી'
  },
  hi: {
    home: 'होम', browse: 'ब्राउज़ करें', exchange: 'एक्सचेंज', donate: 'दान करें', about: 'हमारे बारे में', contact: 'संपर्क',
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
  const target = parseInt(el.dataset.count);
  if (!target) return;
  const duration = 1500;
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
  const adminNavActions = document.getElementById('adminNavActions');

  if (!currentUser) return;

  const role = (currentUser.role || 'student').toUpperCase();
  const userHTML = `
    <span style="font-size: 13px; font-weight: 600; color: var(--color-primary);">
      <i class="fa-solid fa-user-circle"></i> ${currentUser.name}
    </span>
    <a href="dashboard.html" class="btn btn-ghost btn-sm"><i class="fa-solid fa-gauge"></i> Dashboard</a>
    <button id="btnNavLogout" class="btn btn-ghost btn-sm">Logout</button>
  `;

  if (navActions && !adminNavActions) navActions.innerHTML = userHTML;
  if (mobileActions) {
    mobileActions.innerHTML = `
      <div style="font-size: 13px; font-weight: 600; color: var(--color-primary); padding: 8px 0;">
        <i class="fa-solid fa-user-circle"></i> ${currentUser.name} (${role})
      </div>
      <a href="dashboard.html" class="btn btn-ghost btn-block" style="margin-bottom:8px;text-decoration:none;"><i class="fa-solid fa-gauge"></i> Dashboard</a>
      <button id="btnMobileLogout" class="btn btn-secondary btn-block">Logout</button>
    `;
  }

  const logoutHandler = async () => {
    await window.BookAPI.logout();
    showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.reload(), 800);
  };

  document.getElementById('btnNavLogout')?.addEventListener('click', logoutHandler);
  document.getElementById('btnMobileLogout')?.addEventListener('click', logoutHandler);
}

/* ==========================================================================
   BOOK CARD RENDERER (Enhanced with WhatsApp Share + PDF View + Ratings)
   ========================================================================== */

async function renderBooksGrid(container, books, actionLabel = 'View Details') {
  if (!container) return;

  if (!books || books.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No Books Found</h3>
        <p>No books match your current filters. Try adjusting your search criteria.</p>
        <a href="browse.html" class="btn btn-secondary btn-sm">Browse All Books</a>
      </div>
    `;
    return;
  }

  const wishlistIds = await window.BookAPI.getWishlistIds();

  container.innerHTML = books.map(b => {
    const isWished = wishlistIds.includes(b.id);
    const ratingVal = b.rating || 4.7;
    const typeLabel = (b.mode || 'sell').toUpperCase();
    const initials = (b.seller?.name || 'BB').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const isDonation = b.price === 0 || b.mode === 'donate';
    const coverImg = b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
    const isDigital = b.category === 'digital' && b.pdfUrl;
    const waNumber = ((b.seller?.whatsapp || '+919876543210')).replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(`Hi ${b.seller?.name || 'there'}, I found your book "${b.title}" on BookBridge! Is it still available?`);
    const safePdfUrl = (b.pdfUrl || '').replace(/'/g, '');
    const safeTitle = (b.title || '').replace(/'/g, '');

    return `
      <div class="book-card">
        <div class="book-card-actions">
          <button class="card-action-btn ${isWished ? 'active' : ''}" onclick="handleToggleWishlist(event, '${b.id}')" title="Wishlist" aria-label="Toggle wishlist">
            <i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          <button class="card-action-btn" onclick="handleShare('${safeTitle}', '${b.id}')" title="Share" aria-label="Share book">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>

        <div class="book-cover">
          ${isDonation ? '<span class="donation-badge"><i class="fa-solid fa-gift"></i> FREE</span>' : ''}
          <img src="${coverImg}" alt="${b.title}" loading="lazy">
        </div>

        <div class="book-body">
          <div class="book-meta-row">
            <span class="book-category">${b.branch || b.genre || 'Academic'}</span>
            <span class="book-type">${typeLabel}</span>
          </div>

          <div class="book-title">${b.title}</div>
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
          </div>

          <div class="book-footer">
            <div class="${isDonation ? 'book-price-free' : 'book-price'}">
              ${isDonation ? 'FREE' : '&#8377;' + b.price}
              ${b.original && b.price > 0 ? '<span class="original-price">&#8377;' + b.original + '</span>' : ''}
            </div>
            <button class="btn btn-primary btn-sm" onclick="handleBookAction('${b.id}', '${actionLabel}')">${actionLabel}</button>
          </div>

          <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <a href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" rel="noopener" class="btn-whatsapp-share" title="Chat on WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            ${isDigital ? `<button class="btn-pdf-view" onclick="openPDFModal('${safePdfUrl}', '${safeTitle}')">
              <i class="fa-solid fa-file-pdf"></i> View PDF
            </button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ❤️ WISHLIST TOGGLE */
window.handleToggleWishlist = async function(e, bookId) {
  e.stopPropagation();
  const added = await window.BookAPI.toggleWishlist(bookId);
  const btn = e.currentTarget;
  const icon = btn.querySelector('i');

  if (added) {
    btn.classList.add('active');
    icon.className = 'fa-solid fa-heart';
    showToast('Added to wishlist', 'success');
  } else {
    btn.classList.remove('active');
    icon.className = 'fa-regular fa-heart';
    showToast('Removed from wishlist', 'info');
  }
};

/* 📤 SHARE */
window.handleShare = function(title, id) {
  const url = window.location.origin + '/browse.html';
  if (navigator.share) {
    navigator.share({ title: `${title} - BookBridge`, url })
      .catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied to clipboard!', 'success'))
      .catch(() => showToast('Could not copy link', 'warning'));
  }
};

/* 📖 BOOK ACTION MODAL — Enhanced with reviews + ratings */
window.handleBookAction = async function(bookId, actionLabel) {
  const book = await window.BookAPI.getBookById(bookId);
  if (!book) return;

  const modal = document.getElementById('bookDetailsModal');
  const titleEl = document.getElementById('modalBookTitle');
  const bodyEl = document.getElementById('modalBookBody');
  const waBtn = document.getElementById('btnModalWhatsapp');
  const confirmBtn = document.getElementById('btnModalActionConfirm');

  if (!modal) return;

  titleEl.textContent = book.title;
  const seller = book.seller || { name: 'Student', whatsapp: '+919876543210', email: 'student@rcti.ac.in' };
  const waNumber = (seller.whatsapp || '+919876543210').replace(/[^0-9]/g, '');
  const ratingVal = seller.rating || book.rating || 4.8;

  const stars = Array.from({ length: 5 }, (_, i) =>
    `<i class="fa-${i < Math.round(ratingVal) ? 'solid' : 'regular'} fa-star" style="color: var(--color-warning); font-size: 13px;"></i>`
  ).join('');

  const reviews = window.BookDB ? await window.BookDB.getSellerReviews(seller.email) : [];
  const reviewsHTML = reviews.length > 0
    ? reviews.slice(0, 2).map(r => `
        <div class="review-item">
          <div class="review-item-header">
            <span class="review-item-name">${r.reviewerName}</span>
            <div class="star-rating-display">
              ${Array.from({length:5},(_,i) => `<i class="fa-${i < r.rating ? 'solid':'regular'} fa-star"></i>`).join('')}
            </div>
          </div>
          <div class="review-item-text">${r.comment}</div>
          <div class="review-item-date">${new Date(r.date).toLocaleDateString()}</div>
        </div>
      `).join('')
    : `<p style="color: var(--color-gray); font-size: 13px; margin: 0;">No reviews yet for this seller.</p>`;

  const safeBookId = bookId;
  const safeSellerEmail = seller.email;
  const safeSellerName = seller.name.replace(/"/g, '&quot;');

  bodyEl.innerHTML = `
    <div style="display: grid; gap: 10px; font-size: 14px; line-height: 1.8;">
      <div class="flex-between"><span style="color: var(--color-gray);">Author</span><strong>${book.author || 'N/A'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Subject</span><strong>${book.subject || book.genre || 'Academic'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Department</span><span class="badge badge-primary">${book.branch || 'CE'}</span></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Condition</span><strong>${book.condition || 'Good'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Semester</span><strong>${book.semester ? 'Sem ' + book.semester : 'N/A'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Rating</span><strong style="color: var(--color-warning);">&#11088; ${ratingVal}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Price</span><strong style="color: var(--color-primary);">${book.price > 0 ? '&#8377;' + book.price : 'FREE'}</strong></div>
      ${book.exchangeFor ? `<div class="flex-between"><span style="color: var(--color-gray);">Exchange For</span><span style="font-size:13px;">${book.exchangeFor}</span></div>` : ''}
      <div style="padding: 12px; background: rgba(0,0,0,0.02); border-radius: 8px; margin-top: 4px;">
        <span style="color: var(--color-gray); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Description</span>
        <p style="margin-top: 4px; color: var(--color-dark);">${book.description || 'Academic resource listed on BookBridge.'}</p>
      </div>
      <div class="flex-between"><span style="color: var(--color-gray);">Listed by</span><strong>${seller.name}</strong></div>
      <div class="flex-between">
        <span style="color: var(--color-gray);">Seller Rating</span>
        <div style="display:inline-flex;align-items:center;gap:3px;">${stars}<span style="font-size:13px;color:var(--color-gray);margin-left:4px;">${ratingVal} (${reviews.length})</span></div>
      </div>
    </div>
    <div style="margin-top: 16px; border-top: 1px solid var(--color-border); padding-top: 16px;">
      <h4 style="font-size: 14px; margin-bottom: 10px; font-weight: 600;">Seller Reviews</h4>
      ${reviewsHTML}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button onclick="handleLeaveReview('${safeSellerEmail}', '${safeSellerName}', '${safeBookId}')" class="btn btn-ghost btn-sm" style="font-size:12px;">
          <i class="fa-solid fa-star"></i> Leave a Review
        </button>
        ${book.pdfUrl ? `<button onclick="openPDFModal('${book.pdfUrl}', '${book.title.substring(0,30)}'); document.getElementById('bookDetailsModal').classList.remove('active');" class="btn btn-ghost btn-sm" style="font-size:12px;">
          <i class="fa-solid fa-file-pdf"></i> View PDF
        </button>` : ''}
      </div>
    </div>
  `;

  waBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${seller.name}, I'm interested in "${book.title}" on BookBridge!`)}`;
  confirmBtn.textContent = `${actionLabel}`;
  confirmBtn.onclick = async () => {
    const user = await window.BookAPI.getCurrentUser();
    if (!user) {
      showToast('Please login to continue', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1000);
      return;
    }
    await window.BookAPI.sendMessage(seller.email, `Interested in: ${book.title}`, book.title);
    showToast(`Request sent to ${seller.name}!`, 'success');
    modal.classList.remove('active');
  };

  modal.classList.add('active');
};

/* ⭐ LEAVE REVIEW */
window.handleLeaveReview = async function(sellerEmail, sellerName, bookId) {
  const user = await window.BookAPI.getCurrentUser();
  if (!user) { showToast('Please login to leave a review', 'warning'); return; }

  const rating = prompt(`Rate ${sellerName} (1-5 stars):`);
  if (!rating || isNaN(rating) || rating < 1 || rating > 5) return;

  const comment = prompt('Write a short review (optional):') || 'Good experience!';
  await window.BookAPI.addReview(sellerEmail, parseInt(rating), comment);
  showToast('Review submitted! Thank you.', 'success');
  handleBookAction(bookId, 'View Details');
};

/* ==========================================================================
   PAGE CONTROLLERS
   ========================================================================== */

/* 🏠 HOME */
async function initHomePage() {
  const grid = document.getElementById('popularBooksGrid');
  if (!grid) return;
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

        if (filter === 'popular') {
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

  // AI Recommendations for logged-in users
  const aiSection = document.getElementById('aiRecommendationsSection');
  const aiGrid = document.getElementById('aiRecommendationsGrid');
  if (aiSection && aiGrid) {
    const user = await window.BookAPI.getCurrentUser();
    if (user) {
      const recs = await window.BookAPI.getAIRecommendations(user.branch || 'CE', user.semester || 5);
      if (recs && recs.length > 0) {
        aiSection.style.display = 'block';
        const branchInfo = document.getElementById('aiRecBranchInfo');
        if (branchInfo) branchInfo.textContent = `Based on your profile: ${user.branch || 'CE'} · Semester ${user.semester || 5}`;
        await renderBooksGrid(aiGrid, recs.slice(0, 4), 'View Details');
      }
    }
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
    const filters = {};
    const query = searchInput?.value.trim();
    if (query) filters.query = query;
    if (currentBranch !== 'ALL') filters.branch = currentBranch;
    if (subjectSelect?.value && subjectSelect.value !== 'All Subjects') filters.subject = subjectSelect.value;
    if (conditionSelect?.value && conditionSelect.value !== 'Any Condition') filters.condition = conditionSelect.value;
    if (maxPriceInput?.value) filters.maxPrice = maxPriceInput.value;
    if (sortSelect?.value) filters.sort = sortSelect.value;

    const books = await window.BookAPI.getBooks(filters);
    if (resultsCount) resultsCount.textContent = `${books.length} book${books.length !== 1 ? 's' : ''} found`;
    await renderBooksGrid(grid, books, 'View Details');
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

/* 🔄 EXCHANGE */
async function initExchangePage() {
  const grid = document.getElementById('exchangeGrid');
  const triggerBtn = document.getElementById('btnUploadBookTrigger');
  const modal = document.getElementById('uploadModal');
  const form = document.getElementById('uploadBookForm');
  const dropZone = document.getElementById('uploadDropZone');
  const fileInput = document.getElementById('uploadFileInput');
  const fileList = document.getElementById('uploadFileList');
  let uploadedFileBase64 = null;

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) handleFileSelect(fileInput.files[0]);
    });
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedFileBase64 = e.target.result;
      if (dropZone) {
        dropZone.classList.add('has-preview');
        dropZone.querySelector('.upload-preview-img')?.remove();
        const img = document.createElement('img');
        img.className = 'upload-preview-img';
        img.src = uploadedFileBase64;
        img.alt = 'Preview';
        dropZone.appendChild(img);
      }
      if (fileList) {
        fileList.innerHTML = `
          <div class="upload-file-item">
            <i class="fa-solid fa-image" style="color: var(--color-primary);"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
            <button type="button" onclick="clearUploadPreview()" style="color: var(--color-danger); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `;
      }
    };
    reader.readAsDataURL(file);
  }

  window.clearUploadPreview = function() {
    uploadedFileBase64 = null;
    if (fileList) fileList.innerHTML = '';
    if (dropZone) {
      dropZone.classList.remove('has-preview');
      dropZone.querySelector('.upload-preview-img')?.remove();
    }
  };

  // Mode selector
  const modeOptions = document.querySelectorAll('.mode-option');
  const exchangeForGroup = document.getElementById('exchangeForGroup');
  const priceGroup = document.getElementById('uploadPriceGroup');
  let selectedMode = 'exchange';

  modeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      modeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedMode = opt.dataset.mode;
      if (exchangeForGroup) exchangeForGroup.style.display = selectedMode === 'exchange' ? 'block' : 'none';
      if (priceGroup) priceGroup.style.display = selectedMode === 'donate' ? 'none' : 'block';
    });
  });

  triggerBtn?.addEventListener('click', () => modal?.classList.add('active'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    const newBook = {
      title: document.getElementById('uploadTitle').value.trim(),
      author: document.getElementById('uploadAuthor').value.trim(),
      branch: document.getElementById('uploadBranch').value,
      semester: parseInt(document.getElementById('uploadSemester')?.value) || 1,
      gtuCode: document.getElementById('uploadGtuCode')?.value.trim() || '',
      condition: document.getElementById('uploadCondition')?.value || 'Good',
      description: document.getElementById('uploadDescription')?.value.trim() || '',
      exchangeFor: selectedMode === 'exchange' ? (document.getElementById('uploadExchangeFor')?.value.trim() || '') : '',
      price: selectedMode === 'donate' ? 0 : (parseFloat(document.getElementById('uploadPrice')?.value) || 0),
      mode: selectedMode,
      category: 'physical',
      cover: uploadedFileBase64 || null
    };

    const saved = await window.BookAPI.addBook(newBook);
    submitBtn.classList.remove('btn-loading');
    showToast(`"${saved?.title || newBook.title}" listed successfully!`, 'success');
    modal?.classList.remove('active');
    form.reset();
    window.clearUploadPreview();
    uploadedFileBase64 = null;
    selectedMode = 'exchange';
    modeOptions.forEach((o, i) => o.classList.toggle('active', i === 0));
    if (exchangeForGroup) exchangeForGroup.style.display = 'block';
    if (priceGroup) priceGroup.style.display = 'block';
    fetchAndRender();
  });

  async function fetchAndRender() {
    const books = await window.BookAPI.getBooks();
    await renderBooksGrid(grid, books, 'Exchange');
  }

  fetchAndRender();
}

/* 🎁 DONATE */
async function initDonatePage() {
  const grid = document.getElementById('donateBooksGrid');
  const books = await window.BookAPI.getBooks();
  const donated = books.filter(b => b.price === 0 || b.mode === 'donate');
  await renderBooksGrid(grid, donated.length > 0 ? donated : books, 'Claim Free');
}

/* 📬 CONTACT */
function initContactPage() {
  const form = document.getElementById('contactPageForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const text = document.getElementById('contactMessage').value;

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    await window.BookAPI.sendMessage(email, text, 'Contact Support');

    submitBtn.classList.remove('btn-loading');
    showToast(`Thank you, ${name}! Your message has been sent.`, 'success');
    form.reset();
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
        showToast(`Welcome back, ${user.name || 'Student'}!`, 'success');
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'browse.html';
        setTimeout(() => window.location.href = redirectUrl, 800);
      } else {
        showToast('Invalid email or password. Please try again.', 'danger');
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
      name: document.getElementById('regName').value.trim(),
      enrollment: document.getElementById('regEnrollment').value.trim(),
      branch: document.getElementById('regBranch').value,
      email: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value.trim()
    };

    let valid = true;
    ['regName', 'regEnrollment', 'regEmail', 'regPassword'].forEach(id => {
      const input = document.getElementById(id);
      if (!input.value.trim()) {
        input.closest('.form-group')?.classList.add('error');
        valid = false;
      }
    });

    if (!document.getElementById('regTerms')?.checked) {
      showToast('Please accept the Terms of Service', 'warning');
      return;
    }

    if (!valid) return;

    submitBtn.classList.add('btn-loading');
    try {
      const user = await window.BookAPI.register(userData);
      submitBtn.classList.remove('btn-loading');
      if (user) {
        showToast(`Welcome, ${user.name}! Account created.`, 'success');
        // FIX: relative path (not /login.html)
        setTimeout(() => window.location.href = 'login.html', 1200);
      } else {
        showToast('Registration failed. Please try again.', 'danger');
      }
    } catch (err) {
      submitBtn.classList.remove('btn-loading');
      showToast(err.message || 'Registration failed. Please try again.', 'danger');
    }
  });

  document.querySelectorAll('#dedicatedRegisterForm .form-input').forEach(input => {
    input.addEventListener('focus', () => input.closest('.form-group')?.classList.remove('error'));
  });
}

/* 🛡️ ADMIN */
async function initAdminPage() {
  const tbody = document.getElementById('adminBooksTableBody');
  const addBtn = document.getElementById('btnAdminAddBook');
  const adminAddModal = document.getElementById('adminAddBookModal');
  const closeAdminModal = document.getElementById('closeAdminAddBookModal');
  const adminAddForm = document.getElementById('adminAddBookForm');
  const searchInput = document.getElementById('adminBookSearch');

  // Admin tab switching
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

  // Add Book Modal
  addBtn?.addEventListener('click', () => adminAddModal?.classList.add('active'));
  closeAdminModal?.addEventListener('click', () => adminAddModal?.classList.remove('active'));
  adminAddModal?.addEventListener('click', (e) => { if (e.target === adminAddModal) adminAddModal.classList.remove('active'); });

  adminAddForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = adminAddForm.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    const bookData = {
      title: document.getElementById('adminBookTitle').value.trim(),
      author: document.getElementById('adminBookAuthor').value.trim(),
      branch: document.getElementById('adminBookBranch').value,
      semester: parseInt(document.getElementById('adminBookSemester').value) || 1,
      gtuCode: document.getElementById('adminBookGtuCode').value.trim(),
      condition: document.getElementById('adminBookCondition').value,
      price: parseFloat(document.getElementById('adminBookPrice').value) || 0,
      description: document.getElementById('adminBookDesc').value.trim(),
      mode: document.getElementById('adminBookMode').value,
      category: 'official'
    };

    await window.BookAPI.addBook(bookData);
    submitBtn.classList.remove('btn-loading');
    showToast(`"${bookData.title}" added to catalog`, 'success');
    adminAddModal.classList.remove('active');
    adminAddForm.reset();
    fetchAdmin();
  });

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('#adminBooksTableBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  });

  async function fetchAdmin() {
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
    const books = await window.BookAPI.getBooks();
    tbody.innerHTML = books.map(b => `
      <tr>
        <td><span style="color: var(--color-primary); font-weight: 600;">${b.gtuCode || b.id?.substring(0, 12) || 'N/A'}</span></td>
        <td><strong>${b.title}</strong><br><span style="font-size:12px;color:var(--color-gray);">${b.author || ''}</span></td>
        <td><span class="badge badge-primary">${b.branch || 'CE'}</span></td>
        <td>${b.price > 0 ? '&#8377;' + b.price : 'Free'}</td>
        <td><span class="book-status-badge ${(b.status||'available').toLowerCase()}">${b.status || 'Available'}</span></td>
        <td style="text-align: right;">
          <button onclick="handleDeleteAdminBook('${b.id}')" class="btn btn-danger btn-sm" style="height: 32px; padding: 0 12px; font-size: 12px;">Delete</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--color-gray);padding:24px;">No books found.</td></tr>';
  }

  async function fetchAdminUsers() {
    const usersTbody = document.getElementById('adminUsersTableBody');
    if (!usersTbody) return;
    const users = await window.BookAPI.getAllUsers();
    usersTbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td style="font-size:13px;">${u.email}</td>
        <td><span class="badge badge-primary">${u.branch || 'CE'}</span></td>
        <td><span class="book-status-badge ${u.role === 'admin' ? 'available' : 'exchanged'}">${u.role || 'student'}</span></td>
        <td style="font-size:12px;color:var(--color-gray);">${u.enrollment || 'N/A'}</td>
        <td style="text-align: right;">
          <button onclick="handleDeleteAdminUser('${u.id}')" class="btn btn-danger btn-sm" style="height:28px;padding:0 10px;font-size:12px;">Remove</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--color-gray);padding:24px;">No users found.</td></tr>';
  }

  fetchAdmin();
}

window.handleDeleteAdminBook = async function(id) {
  if (confirm('Delete this book listing?')) {
    await window.BookAPI.deleteBook(id);
    showToast('Listing removed', 'success');
    initAdminPage();
  }
};

window.handleDeleteAdminUser = async function(id) {
  if (confirm('Remove this user? This cannot be undone.')) {
    await window.BookAPI.deleteUser(id);
    showToast('User removed', 'success');
    const usersTbody = document.getElementById('adminUsersTableBody');
    if (usersTbody) {
      const users = await window.BookAPI.getAllUsers();
      usersTbody.innerHTML = users.map(u => `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td style="font-size:13px;">${u.email}</td>
          <td><span class="badge badge-primary">${u.branch || 'CE'}</span></td>
          <td><span class="book-status-badge ${u.role === 'admin' ? 'available' : 'exchanged'}">${u.role || 'student'}</span></td>
          <td style="font-size:12px;">${u.enrollment || 'N/A'}</td>
          <td style="text-align:right;"><button onclick="handleDeleteAdminUser('${u.id}')" class="btn btn-danger btn-sm" style="height:28px;padding:0 10px;font-size:12px;">Remove</button></td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--color-gray);">No users found.</td></tr>';
    }
  }
};

/* 📊 DASHBOARD — Full Implementation */
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
    if (greeting) greeting.textContent = 'Please login to view your dashboard.';
    return;
  }

  if (greeting) greeting.textContent = `Welcome back, ${user.name}! 👋`;
  renderSwapMatchmakerBanner('dashMatchmakerContainer');

  const allBooks = await window.BookAPI.getBooks();
  const myBooks = allBooks.filter(b => b.seller?.id === user.id || b.seller?.email === user.email);
  const wishBooks = await window.BookAPI.getWishlistBooks();

  // Overview stats
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

  // Profile Tab
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
        <div class="flex-between"><span style="color:var(--color-gray);">Enrollment</span><strong>${user.enrollment || 'N/A'}</strong></div>
        <div class="flex-between"><span style="color:var(--color-gray);">Department</span><span class="badge badge-primary">${user.branch || 'CE'}</span></div>
        <div class="flex-between"><span style="color:var(--color-gray);">Semester</span><strong>${user.semester ? 'Sem ' + user.semester : 'N/A'}</strong></div>
        <div class="flex-between"><span style="color:var(--color-gray);">Role</span><strong>${(user.role || 'student').toUpperCase()}</strong></div>
        <div class="flex-between"><span style="color:var(--color-gray);">Member Since</span><strong>${new Date(user.createdAt).toLocaleDateString('en-IN', {year:'numeric',month:'short',day:'numeric'})}</strong></div>
      </div>
    `;
  }

  // My Books Tab
  const myBooksGrid = document.getElementById('dashMyBooksGrid');
  if (myBooksGrid) {
    if (myBooks.length === 0) {
      myBooksGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <h3>No Books Listed</h3>
          <p>Upload your first book to start exchanging with students.</p>
          <a href="exchange.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> Upload Book</a>
        </div>
      `;
    } else {
      myBooksGrid.innerHTML = myBooks.map(b => {
        const statusClass = (b.status || 'available').toLowerCase();
        return `
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
                <span class="book-status-badge ${statusClass}">${b.status || 'Available'}</span>
                <span style="font-size:13px;font-weight:600;color:var(--color-primary);">${b.price > 0 ? '&#8377;'+b.price : 'FREE'}</span>
              </div>
              <div class="my-book-actions">
                <button class="btn-edit-book" onclick="handleEditMyBook('${b.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="btn-mark-sold" onclick="handleMarkSold('${b.id}', this)"><i class="fa-solid fa-check"></i> Sold</button>
                <button class="btn-delete-book" onclick="handleDeleteMyBook('${b.id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Wishlist Tab
  const wishlistGrid = document.getElementById('dashWishlistGrid');
  if (wishlistGrid && wishBooks.length > 0) {
    await renderBooksGrid(wishlistGrid, wishBooks, 'View');
  }

  // Messages Tab
  await renderDashboardMessages(user);

  // Notifications Tab
  renderDashboardNotifications(user, myBooks, allBooks);
}

/* ─── Dashboard: Messages ─── */
async function renderDashboardMessages(user) {
  const msgContainer = document.getElementById('dashboardMessagesContent');
  if (!msgContainer) return;

  const msgsBadge = document.getElementById('msgsBadge');
  const allMsgs = JSON.parse(localStorage.getItem('rcti_gtu_messages') || '[]');
  const myMsgs = allMsgs.filter(m => m.receiverEmail === user.email || m.senderEmail === user.email);

  const threads = {};
  myMsgs.forEach(m => {
    const partner = m.senderEmail === user.email ? m.receiverEmail : m.senderEmail;
    const partnerName = m.senderEmail === user.email ? (m.receiverName || partner) : (m.senderName || partner);
    if (!threads[partner]) threads[partner] = { name: partnerName, messages: [], unread: 0 };
    threads[partner].messages.push(m);
    if (m.receiverEmail === user.email) threads[partner].unread++;
  });

  const threadList = Object.entries(threads);
  const unreadCount = threadList.reduce((sum, [, t]) => sum + t.unread, 0);

  if (msgsBadge) {
    if (unreadCount > 0) { msgsBadge.textContent = unreadCount; msgsBadge.style.display = 'inline-flex'; }
    else msgsBadge.style.display = 'none';
  }

  if (threadList.length === 0) {
    msgContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <h3>No Messages Yet</h3>
        <p>Start a conversation by clicking "View Details" on any book.</p>
        <a href="browse.html" class="btn btn-primary btn-sm">Browse Books</a>
      </div>
    `;
    return;
  }

  const colorVars = ['primary', 'secondary', 'info', 'success'];
  msgContainer.innerHTML = `
    <div class="message-thread-list">
      ${threadList.map(([email, thread]) => {
        const lastMsg = thread.messages[thread.messages.length - 1];
        const initials = thread.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const time = lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'}) : '';
        const colorVar = colorVars[email.length % colorVars.length];
        return `
          <div class="msg-thread-item ${thread.unread > 0 ? 'unread' : ''}">
            <div class="msg-avatar" style="background:var(--color-${colorVar});">${initials}</div>
            <div class="msg-thread-content">
              <div class="msg-thread-name">${thread.name}</div>
              <div class="msg-thread-preview">${lastMsg?.bookTitle ? '📖 ' + lastMsg.bookTitle + ': ' : ''}${lastMsg?.text || ''}</div>
            </div>
            <div class="msg-thread-meta">
              <span class="msg-thread-time">${time}</span>
              ${thread.unread > 0 ? `<span class="badge-dot">${thread.unread}</span>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="msg-compose-bar">
      <input type="text" id="newMsgInput" placeholder="Type a message to a seller...">
      <button class="btn btn-primary btn-sm" onclick="showToast('Open a book card to send a message!', 'info')"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
  `;
}

/* ─── Dashboard: Notifications ─── */
function renderDashboardNotifications(user, myBooks, allBooks) {
  const notifContainer = document.getElementById('dashboardNotificationsContent');
  const notifBadge = document.getElementById('notifBadge');
  if (!notifContainer) return;

  const notifications = [];

  if (myBooks.length === 0) {
    notifications.push({
      icon: '📚', bg: 'var(--color-primary-light)', color: 'var(--color-primary)',
      title: 'Start listing your books!',
      desc: 'Upload books you no longer need and help fellow students save money.',
      time: 'Just now', unread: true
    });
  }

  if (myBooks.length > 0) {
    notifications.push({
      icon: '✅', bg: 'var(--color-success-light)', color: 'var(--color-success)',
      title: `Your book "${myBooks[0].title.substring(0, 30)}..." is live`,
      desc: 'Students can now browse and contact you for this book.',
      time: new Date(myBooks[0].createdAt).toLocaleDateString('en-IN'), unread: true
    });
  }

  const wishlistIds = JSON.parse(localStorage.getItem('rcti_gtu_wishlist') || '[]');
  if (wishlistIds.length > 0) {
    notifications.push({
      icon: '❤️', bg: 'var(--color-danger-light)', color: 'var(--color-danger)',
      title: `${wishlistIds.length} book${wishlistIds.length > 1 ? 's' : ''} in your wishlist`,
      desc: 'Check if any wishlisted books have changed their status or price.',
      time: 'Today', unread: false
    });
  }

  const donatedBooks = allBooks.filter(b => b.mode === 'donate');
  if (donatedBooks.length > 0) {
    notifications.push({
      icon: '🎁', bg: 'var(--color-warning-light)', color: 'var(--color-warning)',
      title: `${donatedBooks.length} free book${donatedBooks.length > 1 ? 's' : ''} available`,
      desc: 'New free donations have been listed. Claim them before they\'re gone!',
      time: 'Today', unread: false
    });
  }

  notifications.push({
    icon: '🔔', bg: 'var(--color-info-light)', color: 'var(--color-info)',
    title: 'Welcome to BookBridge!',
    desc: `Hi ${user.name.split(' ')[0]}, explore books by your classmates and save on textbooks.`,
    time: new Date(user.createdAt).toLocaleDateString('en-IN'), unread: false
  });

  const unreadCount = notifications.filter(n => n.unread).length;
  if (notifBadge) {
    if (unreadCount > 0) { notifBadge.textContent = unreadCount; notifBadge.style.display = 'inline-flex'; }
    else notifBadge.style.display = 'none';
  }

  notifContainer.innerHTML = notifications.map(n => `
    <div class="notification-item ${n.unread ? 'unread' : ''}">
      <div class="notif-icon" style="background:${n.bg};color:${n.color};">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}

/* ─── My Books Actions ─── */
window.handleEditMyBook = async function(bookId) {
  const book = await window.BookAPI.getBookById(bookId);
  if (!book) return;

  const newPrice = prompt(`Edit price for "${book.title.substring(0,30)}" (current: ${book.price === 0 ? 'FREE' : '&#8377;' + book.price}):`, book.price);
  if (newPrice === null) return;

  const newCondition = prompt(`Condition (current: ${book.condition}):`, book.condition) || book.condition;

  if (window.BookDB) {
    await window.BookDB.updateBook(bookId, {
      price: parseFloat(newPrice) || 0,
      condition: newCondition
    });
  }
  showToast('Book updated successfully!', 'success');
  initDashboardPage();
};

window.handleMarkSold = async function(bookId, btn) {
  if (window.BookDB) await window.BookDB.updateBookStatus(bookId, 'Sold');
  showToast('Marked as Sold!', 'success');
  if (btn) { btn.textContent = '✅ Sold'; btn.disabled = true; }
  setTimeout(() => initDashboardPage(), 1000);
};

window.handleDeleteMyBook = async function(bookId) {
  if (!confirm('Delete this book listing?')) return;
  await window.BookAPI.deleteBook(bookId);
  showToast('Listing deleted.', 'success');
  initDashboardPage();
};


document.addEventListener('DOMContentLoaded', async () => {
  initGlobalComponents();
  await updateNavUserUI();

  const path = window.location.pathname;
  if (path.includes('admin')) initAdminPage();
  else if (path.includes('browse')) initBrowsePage();
  else if (path.includes('exchange')) initExchangePage();
  else if (path.includes('donate')) initDonatePage();
  else if (path.includes('contact')) initContactPage();
  else if (path.includes('login')) initLoginPage();
  else if (path.includes('register')) initRegisterPage();
  else if (path.includes('dashboard')) initDashboardPage();
  else initHomePage();
});

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

/* ✨ SCROLL ANIMATIONS (Intersection Observer) */
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
  const target = parseInt(el.dataset.count);
  const duration = 1500;
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

      // Close all siblings
      item.closest('.accordion').querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));

      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* 🪟 MODALS */
function setupModals() {
  // Book details modal
  const bookModal = document.getElementById('bookDetailsModal');
  const closeBookModal = document.getElementById('closeBookDetailsModal');
  if (bookModal && closeBookModal) {
    closeBookModal.addEventListener('click', () => bookModal.classList.remove('active'));
    bookModal.addEventListener('click', (e) => {
      if (e.target === bookModal) bookModal.classList.remove('active');
    });
  }

  // Upload modal
  const uploadModal = document.getElementById('uploadModal');
  const closeUpload = document.getElementById('closeUploadModal');
  if (uploadModal && closeUpload) {
    closeUpload.addEventListener('click', () => uploadModal.classList.remove('active'));
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) uploadModal.classList.remove('active');
    });
  }

  // Escape key closes all modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

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
  const adminNavActions = document.getElementById('adminNavActions');

  if (!currentUser) return;

  const role = (currentUser.role || 'student').toUpperCase();
  const userHTML = `
    <span style="font-size: 13px; font-weight: 600; color: var(--color-primary);">
      <i class="fa-solid fa-user-circle"></i> ${currentUser.name}
    </span>
    <button id="btnNavLogout" class="btn btn-ghost btn-sm">Logout</button>
  `;

  if (navActions && !adminNavActions) navActions.innerHTML = userHTML;
  if (mobileActions) {
    mobileActions.innerHTML = `
      <div style="font-size: 13px; font-weight: 600; color: var(--color-primary); padding: 8px 0;">
        <i class="fa-solid fa-user-circle"></i> ${currentUser.name} (${role})
      </div>
      <button id="btnMobileLogout" class="btn btn-secondary btn-block">Logout</button>
    `;
  }

  const logoutHandler = async () => {
    await window.BookAPI.logout();
    showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.reload(), 800);
  };

  document.getElementById('btnNavLogout')?.addEventListener('click', logoutHandler);
  document.getElementById('btnMobileLogout')?.addEventListener('click', logoutHandler);
}

/* ==========================================================================
   BOOK CARD RENDERER (Enhanced)
   ========================================================================== */

async function renderBooksGrid(container, books, actionLabel = 'View Details') {
  if (!container) return;

  if (!books || books.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No Books Found</h3>
        <p>No books match your current filters. Try adjusting your search criteria.</p>
        <a href="/browse.html" class="btn btn-secondary btn-sm">Browse All Books</a>
      </div>
    `;
    return;
  }

  const wishlistIds = await window.BookAPI.getWishlistIds();

  container.innerHTML = books.map(b => {
    const isWished = wishlistIds.includes(b.id);
    const ratingVal = b.rating || 4.7;
    const typeLabel = (b.mode || 'sell').toUpperCase();
    const initials = (b.seller?.name || 'BB').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const isDonation = b.price === 0 || b.mode === 'donate';
    const coverImg = b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

    return `
      <div class="book-card">
        <div class="book-card-actions">
          <button class="card-action-btn ${isWished ? 'active' : ''}" onclick="handleToggleWishlist(event, '${b.id}')" title="Wishlist" aria-label="Toggle wishlist">
            <i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          <button class="card-action-btn" onclick="handleShare('${b.title}')" title="Share" aria-label="Share book">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>

        <div class="book-cover">
          ${isDonation ? '<span class="donation-badge"><i class="fa-solid fa-gift"></i> FREE</span>' : ''}
          <img src="${coverImg}" alt="${b.title}" loading="lazy">
        </div>

        <div class="book-body">
          <div class="book-meta-row">
            <span class="book-category">${b.branch || b.genre || 'Academic'}</span>
            <span class="book-type">${typeLabel}</span>
          </div>

          <div class="book-title">${b.title}</div>
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
          </div>

          <div class="book-footer">
            <div class="${isDonation ? 'book-price-free' : 'book-price'}">
              ${isDonation ? 'FREE' : '₹' + b.price}
              ${b.original && b.price > 0 ? '<span class="original-price">₹' + b.original + '</span>' : ''}
            </div>
            <button class="btn btn-primary btn-sm" onclick="handleBookAction('${b.id}', '${actionLabel}')">${actionLabel}</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ❤️ WISHLIST TOGGLE */
window.handleToggleWishlist = async function(e, bookId) {
  e.stopPropagation();
  const added = await window.BookAPI.toggleWishlist(bookId);
  const btn = e.currentTarget;
  const icon = btn.querySelector('i');

  if (added) {
    btn.classList.add('active');
    icon.className = 'fa-solid fa-heart';
    showToast('Added to wishlist', 'success');
  } else {
    btn.classList.remove('active');
    icon.className = 'fa-regular fa-heart';
    showToast('Removed from wishlist', 'info');
  }
};

/* 📤 SHARE */
window.handleShare = function(title) {
  if (navigator.share) {
    navigator.share({ title: `${title} - BookBridge`, url: window.location.href })
      .catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied to clipboard!', 'success'))
      .catch(() => showToast('Could not copy link', 'warning'));
  }
};

/* 📖 BOOK ACTION MODAL */
window.handleBookAction = async function(bookId, actionLabel) {
  const book = await window.BookAPI.getBookById(bookId);
  if (!book) return;

  const modal = document.getElementById('bookDetailsModal');
  const titleEl = document.getElementById('modalBookTitle');
  const bodyEl = document.getElementById('modalBookBody');
  const waBtn = document.getElementById('btnModalWhatsapp');
  const confirmBtn = document.getElementById('btnModalActionConfirm');

  if (!modal) return;

  titleEl.textContent = book.title;
  const seller = book.seller || { name: 'Student', whatsapp: '+919876543210', email: 'student@rcti.ac.in' };
  const waNumber = (seller.whatsapp || '+919876543210').replace(/[^0-9]/g, '');

  bodyEl.innerHTML = `
    <div style="display: grid; gap: 10px; font-size: 14px; line-height: 1.8;">
      <div class="flex-between"><span style="color: var(--color-gray);">Author</span><strong>${book.author || 'N/A'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Subject</span><strong>${book.subject || book.genre || 'Academic'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Department</span><span class="badge badge-primary">${book.branch || 'CE'}</span></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Condition</span><strong>${book.condition || 'Good'}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Rating</span><strong style="color: var(--color-warning);">⭐ ${book.rating || 4.8}</strong></div>
      <div class="flex-between"><span style="color: var(--color-gray);">Price</span><strong style="color: var(--color-primary);">${book.price > 0 ? '₹' + book.price : 'FREE'}</strong></div>
      <div style="padding: 12px; background: rgba(0,0,0,0.02); border-radius: 8px; margin-top: 4px;">
        <span style="color: var(--color-gray); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Description</span>
        <p style="margin-top: 4px; color: var(--color-dark);">${book.description || 'Academic resource listed on BookBridge.'}</p>
      </div>
      <div class="flex-between" style="margin-top: 4px;"><span style="color: var(--color-gray);">Listed by</span><strong>${seller.name}</strong></div>
    </div>
  `;

  waBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${seller.name}, I'm interested in "${book.title}" on BookBridge!`)}`;
  confirmBtn.textContent = `${actionLabel}`;
  confirmBtn.onclick = async () => {
    const user = await window.BookAPI.getCurrentUser();
    if (!user) {
      showToast('Please login to continue', 'warning');
      setTimeout(() => window.location.href = '/login.html', 1000);
      return;
    }
    await window.BookAPI.sendMessage(seller.email, `Interested in: ${book.title}`, book.title);
    showToast(`Request sent to ${seller.name}!`, 'success');
    modal.classList.remove('active');
  };

  modal.classList.add('active');
};

/* ==========================================================================
   PAGE CONTROLLERS
   ========================================================================== */

/* 🏠 HOME */
async function initHomePage() {
  const grid = document.getElementById('popularBooksGrid');
  if (!grid) return;
  const books = await window.BookAPI.getBooks();
  await renderBooksGrid(grid, books.slice(0, 8), 'View Details');

  // Tab filters for home page popular books
  const tabsContainer = document.getElementById('homeBookTabs');
  if (tabsContainer) {
    const tabs = tabsContainer.querySelectorAll('.home-tab-pill');
    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        let filtered = [...books];

        if (filter === 'popular') {
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

  // Pre-fill from URL params
  const params = new URLSearchParams(window.location.search);
  if (searchInput && params.get('q')) searchInput.value = params.get('q');

  let currentBranch = params.get('branch') || 'ALL';

  // Activate correct pill from URL
  if (currentBranch !== 'ALL') {
    pills.forEach(p => {
      p.classList.remove('active');
      if (p.dataset.dept === currentBranch) p.classList.add('active');
    });
  }

  let debounceTimer;

  async function fetchAndRender() {
    const filters = {};
    const query = searchInput?.value.trim();
    if (query) filters.query = query;
    if (currentBranch !== 'ALL') filters.branch = currentBranch;
    if (subjectSelect?.value && subjectSelect.value !== 'All Subjects') filters.subject = subjectSelect.value;
    if (conditionSelect?.value && conditionSelect.value !== 'Any Condition') filters.condition = conditionSelect.value;
    if (maxPriceInput?.value) filters.maxPrice = maxPriceInput.value;
    if (sortSelect?.value) filters.sort = sortSelect.value;

    const books = await window.BookAPI.getBooks(filters);
    if (resultsCount) resultsCount.textContent = `${books.length} book${books.length !== 1 ? 's' : ''} found`;
    await renderBooksGrid(grid, books, 'View Details');
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

/* 🔄 EXCHANGE */
async function initExchangePage() {
  const grid = document.getElementById('exchangeGrid');
  const triggerBtn = document.getElementById('btnUploadBookTrigger');
  const modal = document.getElementById('uploadModal');
  const form = document.getElementById('uploadBookForm');

  // Drag & drop zone
  const dropZone = document.getElementById('uploadDropZone');
  const fileInput = document.getElementById('uploadFileInput');
  const fileList = document.getElementById('uploadFileList');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) handleFileSelect(fileInput.files[0]);
    });
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'warning');
      return;
    }
    if (fileList) {
      fileList.innerHTML = `
        <div class="upload-file-item">
          <i class="fa-solid fa-image" style="color: var(--color-primary);"></i>
          <span class="file-name">${file.name}</span>
          <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
          <button onclick="this.closest('.upload-file-item').remove()" style="color: var(--color-danger); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
    }
  }

  triggerBtn?.addEventListener('click', () => modal?.classList.add('active'));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    const newBook = {
      title: document.getElementById('uploadTitle').value.trim(),
      author: document.getElementById('uploadAuthor').value.trim(),
      branch: document.getElementById('uploadBranch').value,
      condition: document.getElementById('uploadCondition')?.value || 'Good',
      price: parseFloat(document.getElementById('uploadPrice').value) || 0,
      mode: 'exchange',
      category: 'physical'
    };

    const saved = await window.BookAPI.addBook(newBook);
    submitBtn.classList.remove('btn-loading');
    showToast(`"${saved?.title || newBook.title}" uploaded successfully!`, 'success');
    modal?.classList.remove('active');
    form.reset();
    if (fileList) fileList.innerHTML = '';
    fetchAndRender();
  });

  async function fetchAndRender() {
    const books = await window.BookAPI.getBooks();
    await renderBooksGrid(grid, books, 'Exchange');
  }

  fetchAndRender();
}

/* 🎁 DONATE */
async function initDonatePage() {
  const grid = document.getElementById('donateBooksGrid');
  const books = await window.BookAPI.getBooks();
  const donated = books.filter(b => b.price === 0 || b.mode === 'donate');
  await renderBooksGrid(grid, donated.length > 0 ? donated : books, 'Claim Free');
}

/* 📬 CONTACT */
function initContactPage() {
  const form = document.getElementById('contactPageForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const text = document.getElementById('contactMessage').value;

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    await window.BookAPI.sendMessage(email, text, 'Contact Support');

    submitBtn.classList.remove('btn-loading');
    showToast(`Thank you, ${name}! Your message has been sent.`, 'success');
    form.reset();
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

    // Basic validation
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
        showToast(`Welcome back, ${user.name || 'Student'}!`, 'success');
        // Redirect to browse page after successful login
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'browse.html';
        setTimeout(() => window.location.href = redirectUrl, 800);
      } else {
        showToast('Invalid email or password. Please try again.', 'danger');
      }
    } catch (err) {
      if (submitBtn) submitBtn.classList.remove('btn-loading');
      // Show the server's error message (e.g. 'Invalid email or password.')
      showToast(err.message || 'Login failed. Please check your credentials.', 'danger');
    }
  });

  // Clear error on focus
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

  // Password strength meter
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
      name: document.getElementById('regName').value.trim(),
      enrollment: document.getElementById('regEnrollment').value.trim(),
      branch: document.getElementById('regBranch').value,
      email: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value.trim()
    };

    // Validation
    let valid = true;
    ['regName', 'regEnrollment', 'regEmail', 'regPassword'].forEach(id => {
      const input = document.getElementById(id);
      if (!input.value.trim()) {
        input.closest('.form-group')?.classList.add('error');
        valid = false;
      }
    });

    if (!document.getElementById('regTerms')?.checked) {
      showToast('Please accept the Terms of Service', 'warning');
      return;
    }

    if (!valid) return;

    submitBtn.classList.add('btn-loading');
    const user = await window.BookAPI.register(userData);
    submitBtn.classList.remove('btn-loading');

    if (user) {
      showToast(`Welcome, ${user.name}! Account created.`, 'success');
      setTimeout(() => window.location.href = '/login.html', 1200);
    } else {
      showToast('Registration failed. Please try again.', 'danger');
    }
  });

  // Clear error on focus
  document.querySelectorAll('#dedicatedRegisterForm .form-input').forEach(input => {
    input.addEventListener('focus', () => input.closest('.form-group')?.classList.remove('error'));
  });
}

/* 🛡️ ADMIN CONTROLLER WITH CHARTS & CSV EXPORT */
async function initAdminPage() {
  const tbody = document.getElementById('adminBooksTableBody');
  const addBtn = document.getElementById('btnAdminAddBook');
  const adminAddModal = document.getElementById('adminAddBookModal');
  const closeAdminModal = document.getElementById('closeAdminAddBookModal');
  const adminAddForm = document.getElementById('adminAddBookForm');
  const searchInput = document.getElementById('adminBookSearch');
  const csvBtn = document.getElementById('btnExportCsv');

  // Admin tab switching
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

  // Modal handlers
  addBtn?.addEventListener('click', () => adminAddModal?.classList.add('active'));
  closeAdminModal?.addEventListener('click', () => adminAddModal?.classList.remove('active'));
  adminAddModal?.addEventListener('click', (e) => { if (e.target === adminAddModal) adminAddModal.classList.remove('active'); });

  // Add Book Form
  adminAddForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = adminAddForm.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-loading');

    const bookData = {
      title: document.getElementById('adminBookTitle').value.trim(),
      author: document.getElementById('adminBookAuthor').value.trim(),
      branch: document.getElementById('adminBookBranch').value,
      semester: parseInt(document.getElementById('adminBookSemester').value) || 1,
      gtuCode: document.getElementById('adminBookGtuCode').value.trim(),
      condition: document.getElementById('adminBookCondition').value,
      price: parseFloat(document.getElementById('adminBookPrice').value) || 0,
      description: document.getElementById('adminBookDesc').value.trim(),
      mode: document.getElementById('adminBookMode').value,
      category: 'official'
    };

    await window.BookAPI.addBook(bookData);
    submitBtn.classList.remove('btn-loading');
    showToast(`"${bookData.title}" added to catalog`, 'success');
    adminAddModal.classList.remove('active');
    adminAddForm.reset();
    fetchAdmin();
  });

  // CSV Export
  csvBtn?.addEventListener('click', exportAdminDataCSV);

  // Search filter
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('#adminBooksTableBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  });

  async function fetchAdmin() {
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
    const books = await window.BookAPI.getBooks();
    tbody.innerHTML = books.map(b => `
      <tr>
        <td><span style="color: var(--color-primary); font-weight: 600;">${b.gtuCode || b.id?.substring(0, 12) || 'N/A'}</span></td>
        <td><strong>${b.title}</strong><br><span style="font-size:12px;color:var(--color-gray);">${b.author || ''}</span></td>
        <td><span class="badge badge-primary">${b.branch || 'CE'}</span></td>
        <td>${b.price > 0 ? '&#8377;' + b.price : 'Free / Exchange'}</td>
        <td><span class="book-status-badge ${(b.status||'available').toLowerCase()}">${b.status || 'Available'}</span></td>
        <td style="text-align: right;">
          <button onclick="handleDeleteAdminBook('${b.id}')" class="btn btn-danger btn-sm" style="height: 32px; padding: 0 12px; font-size: 12px;">Delete</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--color-gray);padding:24px;">No books found.</td></tr>';

    initAdminCharts(books);
  }

  async function fetchAdminUsers() {
    const usersTbody = document.getElementById('adminUsersTableBody');
    if (!usersTbody) return;
    const users = await window.BookAPI.getAllUsers();
    const countBadge = document.getElementById('adminUserCount');
    if (countBadge) countBadge.textContent = `${users.length} Total`;

    usersTbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <strong>${u.name}</strong>
          ${u.isVerified !== false ? '<span class="verified-badge" style="margin-left:6px;"><i class="fa-solid fa-circle-check"></i> Verified</span>' : ''}
        </td>
        <td style="font-size:13px;">${u.email}</td>
        <td><span class="badge badge-primary">${u.branch || 'CE'}</span></td>
        <td><span class="book-status-badge ${u.role === 'admin' ? 'available' : 'exchanged'}">${u.role || 'student'}</span></td>
        <td style="font-size:12px;color:var(--color-gray);">${u.enrollment || 'N/A'}</td>
        <td style="text-align: right;">
          <button onclick="handleDeleteAdminUser('${u.id}')" class="btn btn-danger btn-sm" style="height:28px;padding:0 10px;font-size:12px;">Remove</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--color-gray);padding:24px;">No users found.</td></tr>';
  }

  fetchAdmin();
}

/* 📊 CHART.JS ANALYTICS INITIALIZER */
function initAdminCharts(books) {
  if (typeof Chart === 'undefined') return;

  const branchCtx = document.getElementById('branchChartCanvas')?.getContext('2d');
  const typeCtx = document.getElementById('typeChartCanvas')?.getContext('2d');

  if (branchCtx) {
    const counts = { CE: 0, IT: 0, EE: 0, ME: 0, Civil: 0, IC: 0 };
    books.forEach(b => {
      const br = b.branch || 'CE';
      if (counts[br] !== undefined) counts[br]++;
      else counts.CE++;
    });

    new Chart(branchCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#3E6B3A', '#8B5E3C', '#2563EB', '#F59E0B', '#16A34A', '#7c3aed']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  if (typeCtx) {
    const modes = { sell: 0, exchange: 0, donate: 0 };
    books.forEach(b => {
      const m = b.mode || 'sell';
      if (modes[m] !== undefined) modes[m]++;
      else modes.sell++;
    });

    new Chart(typeCtx, {
      type: 'bar',
      data: {
        labels: ['For Sale', 'For Exchange', 'Free Donation'],
        datasets: [{
          label: 'Book Count',
          data: [modes.sell, modes.exchange, modes.donate],
          backgroundColor: ['#3E6B3A', '#2563EB', '#16A34A']
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
}

/* 📥 CSV DATA EXPORTER */
async function exportAdminDataCSV() {
  const books = await window.BookAPI.getBooks();
  if (!books || books.length === 0) {
    showToast('No books data to export', 'warning');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,ID,Title,Author,Branch,Semester,Price,Mode,Status,Seller\n';
  books.forEach(b => {
    const row = [
      `"${b.id}"`,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.author || '').replace(/"/g, '""')}"`,
      `"${b.branch || ''}"`,
      `"${b.semester || 1}"`,
      `"${b.price || 0}"`,
      `"${b.mode || 'sell'}"`,
      `"${b.status || 'Available'}"`,
      `"${(b.seller?.name || '').replace(/"/g, '""')}"`
    ].join(',');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `bookbridge_catalog_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Catalog exported to CSV successfully!', 'success');
}

/* ⚡ SWAP MATCHMAKER BANNER RENDERER */
async function renderSwapMatchmakerBanner(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = await window.BookAPI.getCurrentUser();
  if (!user) return;

  const allBooks = await window.BookAPI.getBooks();
  const exchangeBooks = allBooks.filter(b => b.mode === 'exchange' && b.seller?.email !== user.email);

  if (exchangeBooks.length === 0) return;

  const matchedBook = exchangeBooks[0];
  const sellerName = matchedBook.seller?.name || 'A Student';

  container.innerHTML = `
    <div class="matchmaker-banner animate-on-scroll">
      <div class="matchmaker-info">
        <h3>⚡ Perfect Swap Match Found!</h3>
        <p><strong>${sellerName}</strong> has listed <strong>"${matchedBook.title}"</strong> (${matchedBook.branch} Sem ${matchedBook.semester || 5}). Tap to propose a trade!</p>
      </div>
      <button onclick="handleBookAction('${matchedBook.id}', 'Propose Swap')" class="matchmaker-btn">
        <i class="fa-solid fa-arrows-rotate"></i> Swap Now
      </button>
    </div>
  `;
}

