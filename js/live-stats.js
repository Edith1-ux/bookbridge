/* ==========================================
   BookBridge - Unified Live Stats Counter Engine
   Real-time animated counters from database across ALL pages
========================================== */

/**
 * Get live statistics by querying the actual database/localStorage
 * Returns: { students, books, exchanges, donated, saved }
 */
async function getLiveStats() {
    try {
        if (window.BookDB && typeof window.BookDB.init === 'function') {
            await window.BookDB.init();
        }

        // 1. Try public stats endpoint from API first
        if (window.BookAPI && typeof window.BookAPI.getPublicStats === 'function') {
            const apiStats = await window.BookAPI.getPublicStats();
            if (apiStats) return apiStats;
        }

        // 2. Local Storage / Client Database calculation fallback
        let users = [];
        let books = [];

        if (window.BookDB && typeof window.BookDB.getAllUsers === 'function') {
            users = await window.BookDB.getAllUsers();
            books = await window.BookDB.getBooks();
        } else {
            users = JSON.parse(localStorage.getItem('rcti_gtu_users') || '[]');
            books = JSON.parse(localStorage.getItem('rcti_gtu_lab_manual_books') || '[]');
        }

        const offers = JSON.parse(localStorage.getItem('rcti_gtu_offers') || '[]');
        const transactions = JSON.parse(localStorage.getItem('rcti_gtu_txs') || '[]');

        const studentUsers = Array.isArray(users) ? users.filter(u => u.role === 'student') : [];
        const realUsersCount = studentUsers.length;
        const realBooksCount = (Array.isArray(books) && books.length > 0) ? books.length : 0;
        const exchangeBooks = Array.isArray(books) ? books.filter(b => b.mode === 'exchange' || Boolean(b.exchangeFor)).length : 0;
        const donatedBooks = Array.isArray(books) ? books.filter(b => b.mode === 'donate' || b.price === 0).length : 0;
        const totalSaved = Array.isArray(books) ? books.reduce((sum, b) => sum + (parseFloat(b.original || b.original_price) || 0), 0) : 0;

        const realExchangesCount = (offers ? offers.length : 0) + (transactions ? transactions.length : 0);

        return {
            students: realUsersCount,
            books: realBooksCount,
            exchanges: realExchangesCount,
            donated: donatedBooks,
            saved: totalSaved
        };
    } catch (e) {
        console.error("Error calculating real-time live stats:", e);
        return { students: 0, books: 0, exchanges: 0, donated: 0, saved: 0 };
    }
}

/**
 * Format numbers with Indian locale commas (e.g. 1,00,000)
 */
function formatStatNumber(num) {
    return Number(num || 0).toLocaleString('en-IN');
}

/**
 * Animate a counter element from start to end value with easing
 */
function animateValue(element, start, end, duration = 1200) {
    if (typeof end !== 'number' || isNaN(end)) return;
    if (isNaN(start)) start = 0;

    const startTimestamp = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(eased * (end - start) + start);
        element.textContent = formatStatNumber(currentVal);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = formatStatNumber(end);
        }
    }
    window.requestAnimationFrame(step);
}

/**
 * Master function: Update ALL stat counter elements on ANY page with real live data
 * Handles: index.html, about.html, donate.html, exchange.html, dashboard.html, admin.html, etc.
 */
async function updateLiveStatsUI() {
    const stats = await getLiveStats();

    // ── INDEX.HTML: Hero stats (top of page) ──
    const heroStudentsEl = document.getElementById('heroActiveStudents');
    const heroBooksEl = document.getElementById('heroBooksListed');
    const heroExchangesEl = document.getElementById('heroSuccessfulExchanges');

    if (heroStudentsEl) animateValue(heroStudentsEl, 0, stats.students);
    if (heroBooksEl) animateValue(heroBooksEl, 0, stats.books);
    if (heroExchangesEl) animateValue(heroExchangesEl, 0, stats.exchanges);

    // Also update data-count attribute for counter animation system
    if (heroStudentsEl) heroStudentsEl.setAttribute('data-count', stats.students);
    if (heroBooksEl) heroBooksEl.setAttribute('data-count', stats.books);
    if (heroExchangesEl) heroExchangesEl.setAttribute('data-count', stats.exchanges);

    // ── INDEX.HTML: Main stats section ──
    const activeStudentsEl = document.getElementById('activeStudents');
    const booksListedEl = document.getElementById('booksListed');
    const successfulExchangesEl = document.getElementById('successfulExchanges');
    const booksDonatedEl = document.getElementById('booksDonated');

    if (activeStudentsEl) animateValue(activeStudentsEl, 0, stats.students);
    if (booksListedEl) animateValue(booksListedEl, 0, stats.books);
    if (successfulExchangesEl) animateValue(successfulExchangesEl, 0, stats.exchanges);
    if (booksDonatedEl) animateValue(booksDonatedEl, 0, stats.donated);

    // ── ABOUT.HTML / ANY PAGE: Elements with data-stat-type attribute ──
    document.querySelectorAll("[data-stat-type]").forEach(el => {
        const type = el.getAttribute("data-stat-type");
        if (type && stats[type] !== undefined) {
            const targetVal = stats[type];
            const currentVal = parseInt(el.getAttribute("data-count")) || 0;
            el.setAttribute("data-count", targetVal);
            animateValue(el, currentVal, targetVal);
        }
    });

    // ── ADMIN.HTML: Admin dashboard stats (live from DB) ──
    const adminUsers = document.getElementById('adminStatUsers');
    const adminBooks = document.getElementById('adminStatBooks');
    const adminSwaps = document.getElementById('adminStatSwaps');
    const adminDonations = document.getElementById('adminStatDonations');

    if (adminUsers) { adminUsers.setAttribute('data-count', stats.students); animateValue(adminUsers, 0, stats.students); }
    if (adminBooks) { adminBooks.setAttribute('data-count', stats.books); animateValue(adminBooks, 0, stats.books); }
    if (adminSwaps) { adminSwaps.setAttribute('data-count', stats.exchanges); animateValue(adminSwaps, 0, stats.exchanges); }
    if (adminDonations) { adminDonations.setAttribute('data-count', stats.donated); animateValue(adminDonations, 0, stats.donated); }

    // ── DONATE.HTML: Donation stats (live from DB) ──
    const donateStatEls = document.querySelectorAll('.donate-live-stat');
    donateStatEls.forEach(el => {
        const statType = el.getAttribute('data-donate-stat');
        if (statType === 'donated') { el.setAttribute('data-count', stats.donated); animateValue(el, 0, stats.donated); }
        if (statType === 'students') { el.setAttribute('data-count', stats.students); animateValue(el, 0, stats.students); }
        if (statType === 'saved') { el.setAttribute('data-count', stats.saved); animateValue(el, 0, stats.saved); }
    });

    // ── DASHBOARD.HTML: Personal user stats ──
    updateDashboardStats(stats);

    // ── Update category counts on browse-like pages ──
    updateCategoryCountsOnly();
}

/**
 * Dashboard personal stats (based on current logged-in user's books)
 */
async function updateDashboardStats(globalStats) {
    const dashMyBooks = document.getElementById('dashMyBooks');
    const dashWishlist = document.getElementById('dashWishlist');
    const dashExchanges = document.getElementById('dashExchanges');
    const dashDonations = document.getElementById('dashDonations');

    if (!dashMyBooks) return; // Not on dashboard page

    try {
        let myBooks = 0, myWishlist = 0, myExchanges = 0, myDonations = 0;

        const currentUser = JSON.parse(localStorage.getItem('rcti_gtu_current_user') || 'null');
        if (currentUser) {
            let books = [];
            if (window.BookDB && typeof window.BookDB.getBooks === 'function') {
                books = await window.BookDB.getBooks();
            } else {
                books = JSON.parse(localStorage.getItem('rcti_gtu_lab_manual_books') || '[]');
            }

            if (Array.isArray(books)) {
                const userBooks = books.filter(b => b.seller && (b.seller.email === currentUser.email || b.seller.id === currentUser.id));
                myBooks = userBooks.length;
                myExchanges = userBooks.filter(b => b.mode === 'exchange').length;
                myDonations = userBooks.filter(b => b.mode === 'donate').length;
            }

            const wishlist = JSON.parse(localStorage.getItem('rcti_gtu_wishlist') || '[]');
            myWishlist = Array.isArray(wishlist) ? wishlist.length : 0;
        }

        animateValue(dashMyBooks, 0, myBooks);
        animateValue(dashWishlist, 0, myWishlist);
        animateValue(dashExchanges, 0, myExchanges);
        animateValue(dashDonations, 0, myDonations);
    } catch (e) {
        console.error("Error updating dashboard stats:", e);
    }
}

/**
 * Update branch/department category counts on browse pages
 */
async function updateCategoryCountsOnly() {
    try {
        let books = [];
        if (window.BookAPI && typeof window.BookAPI.getBooks === 'function') {
            books = await window.BookAPI.getBooks();
        } else if (window.BookDB && typeof window.BookDB.getBooks === 'function') {
            books = await window.BookDB.getBooks();
        } else {
            books = JSON.parse(localStorage.getItem('rcti_gtu_lab_manual_books') || '[]');
        }

        if (Array.isArray(books)) {
            const counts = {
                CE: books.filter(b => (b.branch || '').toUpperCase() === 'CE').length,
                IT: books.filter(b => (b.branch || '').toUpperCase() === 'IT').length,
                EE: books.filter(b => (b.branch || '').toUpperCase() === 'EE').length,
                ME: books.filter(b => (b.branch || '').toUpperCase() === 'ME').length,
                Civil: books.filter(b => (b.branch || '').toUpperCase() === 'CIVIL').length,
                Science: books.filter(b => (b.branch || '').toUpperCase() === 'IC' || (b.subject || '').toLowerCase().includes('science') || (b.genre || '').toLowerCase().includes('science')).length,
                Physics: books.filter(b => (b.subject || '').toLowerCase().includes('physics') || (b.title || '').toLowerCase().includes('physics')).length,
                General: books.filter(b => !['CE', 'IT', 'EE', 'ME', 'CIVIL'].includes((b.branch || '').toUpperCase())).length
            };

            document.querySelectorAll('[data-dept-count]').forEach(el => {
                const dept = el.getAttribute('data-dept-count');
                if (dept && counts[dept] !== undefined) {
                    const cnt = counts[dept];
                    el.textContent = `${formatStatNumber(cnt)} Book${cnt !== 1 ? 's' : ''} & Manuals`;
                }
            });
        }
    } catch (err) {
        console.error("Error updating category counts:", err);
    }
}

// Global hook so other scripts can trigger a stats refresh after book uploads, registrations, etc.
window.updateLiveStatsUI = updateLiveStatsUI;
window.getLiveStats = getLiveStats;

// Run on every page load
document.addEventListener("DOMContentLoaded", () => {
    updateLiveStatsUI();

    // Auto-refresh every 15 seconds for real-time feel
    setInterval(updateLiveStatsUI, 15000);
});
