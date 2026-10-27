/* ==========================================
   BookBridge - Browse Books Render
========================================== */

window.DEFAULT_BOOK_COVER = window.DEFAULT_BOOK_COVER || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420' width='300' height='420'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e3a8a'/%3E%3Cstop offset='100%25' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='420' rx='12' fill='url(%23bg)'/%3E%3Crect x='15' y='15' width='270' height='390' rx='8' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Ctext x='150' y='180' font-size='56' text-anchor='middle'%3E📚%3C/text%3E%3Ctext x='150' y='235' font-size='20' font-weight='bold' fill='%23ffffff' font-family='system-ui,sans-serif' text-anchor='middle'%3EBookBridge%3C/text%3E%3Ctext x='150' y='265' font-size='13' fill='rgba(255,255,255,0.8)' font-family='system-ui,sans-serif' text-anchor='middle'%3EAcademic Book%3C/text%3E%3C/svg%3E";
const DEFAULT_BOOK_COVER = window.DEFAULT_BOOK_COVER;

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.escapeHTML = window.escapeHTML || escapeHTML;

/* ==========================================
   Render Books Function
========================================== */

function renderBooks(bookList = books) {

    // Get the Books Container
    const booksContainer = document.getElementById("booksContainer");
    if (!booksContainer) return;

    // Get the Book Count Element
    const bookCount = document.getElementById("bookCount");

    // Clear Previous Books
    booksContainer.innerHTML = "";

    // Update Total Books Count
    if (bookCount) bookCount.textContent = (bookList || []).length;

    // If No Books Are Available
    if (!bookList || bookList.length === 0) {

        booksContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="mb-3">
                    <i class="bi bi-book fs-1 text-muted"></i>
                </div>
                <h4 class="text-muted fw-bold">No Books Found</h4>
                <p class="text-muted">No books match your active search or filter criteria.</p>
                <button class="btn btn-success btn-sm mt-2 fw-semibold" onclick="if(typeof clearFilters === 'function') clearFilters();">
                    <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters & Show All Books
                </button>
            </div>
        `;

        return;
    }

    // Loop Through Every Book
    bookList.forEach(book => {

        // Show Price or Donate
        const isFree = book.type === "Donate" || book.mode === "donate" || Number(book.price) === 0;
        const isExchange = book.type === "Exchange" || book.mode === "exchange";
        const priceText = isFree
            ? "Donate (Free)"
            : (isExchange ? "Book Swap (₹0)" : `₹${book.price}`);

        const actionLabel = isFree ? "Claim" : (isExchange ? "Swap" : "Buy");
        const actionIcon = isFree ? "bi-gift-fill" : (isExchange ? "bi-arrow-left-right" : "bi-cart-check-fill");
        const actionTitle = isFree ? "Claim Free Book" : (isExchange ? "Swap / Exchange Book" : "Buy Book & Contact Seller");

        const bookImg = book.image || book.cover || DEFAULT_BOOK_COVER;

        // Create Book Card
        const bookCard = `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3 book-column">
                <div class="book-card">
                    <!-- Book Image with Safe Fallback -->
                    <img
                        src="${escapeHTML(bookImg)}"
                        alt="${escapeHTML(book.title || 'Book Cover')}"
                        class="book-image"
                        loading="lazy"
                        onerror="if(!this.dataset.fallback){this.dataset.fallback='1'; this.src=window.DEFAULT_BOOK_COVER;}">

                    <div class="book-content">
                        <!-- Book Badges -->
                        <div class="book-badges">
                            <span>${escapeHTML(book.department || book.branch || 'General')}</span>
                            <span>Sem ${escapeHTML(book.semester || 1)}</span>
                            <span>${escapeHTML(book.category || book.genre || 'Book')}</span>
                        </div>

                        <!-- Book Title -->
                        <h5 class="book-title">
                            ${escapeHTML(book.title || 'Untitled Book')}
                        </h5>

                        <!-- Book Author -->
                        <p class="book-author">
                            ${escapeHTML(book.author || 'Atul Prakashan')}
                        </p>

                        <!-- Book Price -->
                        <div class="book-price">
                            ${escapeHTML(priceText)}
                        </div>

                        <!-- Book Condition -->
                        <div class="book-condition">
                            ${escapeHTML(book.condition || 'Good')}
                        </div>

                        <!-- View Details & Buy/Action -->
                        <div class="d-flex gap-2 align-items-center mt-2 flex-wrap">
                            <button
                                class="view-btn flex-grow-1"
                                data-id="${book.id}">
                                View Details
                            </button>
                            <button
                                class="btn btn-outline-success btn-sm chat-card-btn px-2 fw-semibold"
                                data-id="${book.id}"
                                title="${escapeHTML(actionTitle)}">
                                <i class="bi ${actionIcon} me-1"></i> ${escapeHTML(actionLabel)}
                            </button>
                            ${(typeof isAdminMode !== "undefined" && isAdminMode) ? `
                                <button class="btn btn-sm btn-warning text-dark admin-edit-btn px-2" data-id="${book.id}" title="Edit Book & Replace Photo">
                                    <i class="bi bi-pencil-square me-1"></i> Edit Photo
                                </button>
                                <button class="btn btn-sm btn-outline-danger admin-delete-btn px-2" data-id="${book.id}" title="Delete Book">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add Book Card To Page
        booksContainer.innerHTML += bookCard;
    });
}

/**
 * Check if the active visitor has logged in as a student
 */
function isStudentAuthenticated() {
    try {
        const u = JSON.parse(localStorage.getItem("rcti_gtu_current_user") || "null");
        if (u && (u.email || u.id || u.name)) return true;
        const token = localStorage.getItem("bb_access_token");
        if (token) return true;
    } catch (e) {}
    return false;
}

/* ==========================================
   View Details & Chat Modal Event Listeners
========================================== */
let activeViewedBook = null;

document.addEventListener("DOMContentLoaded", () => {
    const booksContainer = document.getElementById("booksContainer");
    if (booksContainer) {
        booksContainer.addEventListener("click", (e) => {
            // Direct Card Chat Button
            const chatBtn = e.target.closest(".chat-card-btn");
            if (chatBtn) {
                const rawId = chatBtn.getAttribute("data-id");
                const book = (typeof books !== 'undefined' ? books : []).find(b => String(b.id) === String(rawId));
                if (!book) return;

                const isFree = book.type === "Donate" || book.mode === "donate" || Number(book.price) === 0;
                const isExchange = book.type === "Exchange" || book.mode === "exchange";
                const actionDesc = isFree ? "claim free donated books" : (isExchange ? "propose book exchanges" : "buy this book and chat with the student seller");

                // STRICT AUTH CHECK
                if (!isStudentAuthenticated()) {
                    if (typeof window.showAuthPrompt === "function") {
                        window.showAuthPrompt(
                            "Student Login Required",
                            `You are currently browsing as a guest. To <strong>${actionDesc}</strong>, you must sign in with your student account.`,
                            "login.html?redirect=browse.html"
                        );
                    } else {
                        alert("Please login to continue.");
                        window.location.href = "login.html?redirect=browse.html";
                    }
                    return;
                }

                if (typeof window.openBookBridgeChat === "function") {
                    const seller = book.seller || { name: `Student (${book.department || 'CE'})`, email: 'student@rcti.ac.in', whatsapp: '+919876543210' };
                    const mode = isFree ? "donate" : (isExchange ? "exchange" : "sell");
                    window.openBookBridgeChat({
                        receiverEmail: seller.email,
                        receiverName: seller.name,
                        receiverPhone: seller.whatsapp,
                        bookId: book.id,
                        bookTitle: book.title,
                        bookPrice: book.price || 0,
                        mode: mode,
                        bookImage: book.image || book.cover
                    });
                }
                return;
            }

            // View Details Button
            const btn = e.target.closest(".view-btn");
            if (!btn) return;

            const rawId = btn.getAttribute("data-id");
            const book = (typeof books !== 'undefined' ? books : []).find(b => String(b.id) === String(rawId));
            if (!book) return;

            activeViewedBook = book;

            const modalImg = document.getElementById("modalBookImage");
            if (modalImg) {
                const src = book.image || book.cover || DEFAULT_BOOK_COVER;
                modalImg.src = src;
                modalImg.onerror = function() { this.onerror = null; this.src = DEFAULT_BOOK_COVER; };
                modalImg.alt = book.title || 'Book Image';
            }

            const titleEl = document.getElementById("modalBookTitle");
            if (titleEl) titleEl.textContent = book.title || '';

            const authorEl = document.getElementById("modalBookAuthor");
            if (authorEl) authorEl.textContent = book.author || '';

            const deptEl = document.getElementById("modalBookDepartment");
            if (deptEl) deptEl.textContent = book.department || book.branch || '';

            const semEl = document.getElementById("modalBookSemester");
            if (semEl) semEl.textContent = `Semester ${book.semester || 1}`;

            const catEl = document.getElementById("modalBookCategory");
            if (catEl) catEl.textContent = book.category || book.genre || '';

            const condEl = document.getElementById("modalBookCondition");
            if (condEl) condEl.textContent = book.condition || 'Good';

            const typeEl = document.getElementById("modalBookType");
            const isFree = book.type === "Donate" || book.mode === "donate" || Number(book.price) === 0;
            const isExchange = book.type === "Exchange" || book.mode === "exchange";
            if (typeEl) typeEl.textContent = isFree ? 'Donate (Free)' : (isExchange ? 'Exchange (Swap)' : (book.type || 'Sell'));

            const priceEl = document.getElementById("modalBookPrice");
            if (priceEl) {
                priceEl.textContent = isFree ? "Free (Donate)" : (isExchange ? "Book Swap (₹0)" : `₹${book.price}`);
            }

            const sellerEl = document.getElementById("modalBookSeller");
            if (sellerEl) {
                sellerEl.textContent = book.seller?.name ? `${book.seller.name} (${book.seller.branch || book.department || 'CE'})` : 'Verified Student Seller';
            }

            const descEl = document.getElementById("modalBookDescription");
            if (descEl) {
                descEl.textContent = book.description || 'Academic textbook listed on the BookBridge campus sharing platform.';
            }

            const modalChatBtn = document.getElementById("modalChatActionBtn");
            if (modalChatBtn) {
                if (isFree) {
                    modalChatBtn.innerHTML = '<i class="bi bi-gift-fill me-1"></i> Claim Free Book';
                } else if (isExchange) {
                    modalChatBtn.innerHTML = '<i class="bi bi-arrow-left-right me-1"></i> Swap / Exchange Book';
                } else {
                    modalChatBtn.innerHTML = '<i class="bi bi-cart-check-fill me-1"></i> Buy Book & Chat with Seller';
                }
            }

            const modalElement = document.getElementById("bookDetailsModal");
            if (modalElement && typeof bootstrap !== "undefined") {
                const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        });
    }

    // Modal Chat Action Button
    const modalChatActionBtn = document.getElementById("modalChatActionBtn");
    if (modalChatActionBtn) {
        modalChatActionBtn.addEventListener("click", () => {
            if (!activeViewedBook) return;

            const isFree = activeViewedBook.type === "Donate" || activeViewedBook.mode === "donate" || Number(activeViewedBook.price) === 0;
            const isExchange = activeViewedBook.type === "Exchange" || activeViewedBook.mode === "exchange";
            const actionDesc = isFree ? "claim free donated books" : (isExchange ? "propose book exchanges" : "buy this book and chat with the seller");

            // STRICT AUTH CHECK
            if (!isStudentAuthenticated()) {
                // Hide Details Modal first
                const modalElement = document.getElementById("bookDetailsModal");
                if (modalElement && typeof bootstrap !== "undefined") {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }

                if (typeof window.showAuthPrompt === "function") {
                    window.showAuthPrompt(
                        "Student Login Required",
                        `You are currently browsing as a guest. To <strong>${actionDesc}</strong>, you must sign in with your student account.`,
                        "login.html?redirect=browse.html"
                    );
                } else {
                    alert("Please login to continue.");
                    window.location.href = "login.html?redirect=browse.html";
                }
                return;
            }

            // Hide Details Modal
            const modalElement = document.getElementById("bookDetailsModal");
            if (modalElement && typeof bootstrap !== "undefined") {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }

            const seller = activeViewedBook.seller || { name: `Student (${activeViewedBook.department || 'CE'})`, email: 'student@rcti.ac.in', whatsapp: '+919876543210' };
            const mode = isFree ? "donate" : (isExchange ? "exchange" : "sell");

            if (typeof window.openBookBridgeChat === "function") {
                window.openBookBridgeChat({
                    receiverEmail: seller.email,
                    receiverName: seller.name,
                    receiverPhone: seller.whatsapp,
                    bookId: activeViewedBook.id,
                    bookTitle: activeViewedBook.title,
                    bookPrice: activeViewedBook.price || 0,
                    mode: mode,
                    bookImage: activeViewedBook.image || activeViewedBook.cover
                });
            }
        });
    }
});
