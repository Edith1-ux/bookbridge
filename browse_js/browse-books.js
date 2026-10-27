/* ==========================================
   BookBridge - Main Browse JavaScript
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync User Session in Navbar
    syncBrowseNavUser();

    // 2. Wire Hero Upload Button Auth Check
    initHeroUploadAuthCheck();

    // 3. Pre-load URL Search/Filter Parameters (from Home Page & Tags)
    initUrlParamsPreload();

    // 4. Initialize Quick Filter Chips
    initQuickChips();

    // 5. Display Initial Books With Current Filters & Sort
    if (typeof applyFilters === "function") {
        applyFilters();
    } else if (typeof renderBooks === "function") {
        renderBooks(books);
    }

    // 6. Asynchronously Load Live Books from Backend Database / API for All Visitors
    loadLiveBooksFromAPI();
});

function syncBrowseNavUser() {
    const navActions = document.getElementById("browseNavActions");
    if (!navActions) return;

    try {
        const currentUser = JSON.parse(localStorage.getItem("rcti_gtu_current_user") || "null");
        if (currentUser && (currentUser.name || currentUser.email)) {
            const displayName = currentUser.name || currentUser.email.split('@')[0];
            navActions.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <span class="fw-semibold text-success d-none d-sm-inline">
                        <i class="bi bi-person-circle me-1"></i> ${displayName}
                    </span>
                    <a href="dashboard.html" class="btn btn-outline-success btn-sm">
                        <i class="bi bi-speedometer2 me-1"></i> Dashboard
                    </a>
                    <button id="btnBrowseLogout" class="btn btn-outline-danger btn-sm" title="Log Out">
                        <i class="bi bi-box-arrow-right"></i>
                    </button>
                </div>
            `;

            document.getElementById("btnBrowseLogout")?.addEventListener("click", () => {
                localStorage.removeItem("rcti_gtu_current_user");
                localStorage.removeItem("bb_access_token");
                localStorage.removeItem("bb_refresh_token");
                window.location.reload();
            });
        }
    } catch (e) {
        console.warn("Could not sync nav user on browse page:", e);
    }
}

/**
 * Hero Section "Upload & Exchange Offer" Button Guard
 * Prohibits visitors from opening upload modal without active student login
 */
function initHeroUploadAuthCheck() {
    const heroBtn = document.getElementById("btnBrowseHeroUpload");
    if (!heroBtn) return;

    heroBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem("rcti_gtu_current_user") || "null");
        const token = localStorage.getItem("bb_access_token");

        if (!currentUser && !token) {
            showAuthPrompt(
                "Student Login Required to List Books",
                "You are browsing as a guest. To <strong>upload books for sale</strong> or <strong>propose exchange offers</strong>, you must sign in with your student account.",
                "login.html?redirect=browse.html"
            );
            return;
        }

        const modalEl = document.getElementById("uploadBookModal");
        if (modalEl && typeof bootstrap !== "undefined") {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    });
}

/**
 * Universal Modal Auth Prompt
 */
window.showAuthPrompt = function (title, desc, redirectUrl = "login.html?redirect=browse.html") {
    const modalEl = document.getElementById("authRequiredModal");
    if (modalEl && typeof bootstrap !== "undefined") {
        if (title) {
            const titleEl = document.getElementById("authModalTitle");
            if (titleEl) titleEl.textContent = title;
        }
        if (desc) {
            const descEl = document.getElementById("authModalDesc");
            if (descEl) descEl.innerHTML = desc;
        }
        if (redirectUrl) {
            const btn = document.getElementById("authModalLoginBtn");
            if (btn) btn.href = redirectUrl;
        }
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } else {
        alert(title + "\n\n" + (desc.replace(/<[^>]+>/g, '')));
        window.location.href = redirectUrl;
    }
};

/**
 * Preload URL search params (e.g. ?q=python or ?branch=CE) from Home page
 */
function initUrlParamsPreload() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const branch = params.get('branch');
    const cat = params.get('cat');

    const searchInput = document.getElementById("searchInput");
    const deptSelect = document.getElementById("departmentFilter");
    const catSelect = document.getElementById("categoryFilter");

    if (q && searchInput) {
        searchInput.value = q;
    }
    if (cat && catSelect) {
        catSelect.value = cat;
    }
    if (branch && deptSelect) {
        for (let i = 0; i < deptSelect.options.length; i++) {
            const optVal = (deptSelect.options[i].value || '').toLowerCase();
            const optText = (deptSelect.options[i].text || '').toLowerCase();
            if (optVal.includes(branch.toLowerCase()) || optText.includes(branch.toLowerCase())) {
                deptSelect.selectedIndex = i;
                break;
            }
        }
    }
}

/**
 * Initialize Quick Filter Chips
 */
function initQuickChips() {
    const chips = document.querySelectorAll('.browse-chip');
    const deptSelect = document.getElementById('departmentFilter');
    if (!chips.length) return;

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            if (chip.dataset.dept !== undefined && deptSelect) {
                deptSelect.value = chip.dataset.dept;
            }
            if (typeof applyFilters === 'function') {
                applyFilters();
            }
        });
    });
}

/**
 * Load Live Books from API (/api/books/) and Local Storage
 * Ensures ANY visitor properly sees books listed by real students
 */
async function loadLiveBooksFromAPI() {
    try {
        let apiBooks = [];
        if (window.BookAPI && typeof window.BookAPI.getBooks === "function") {
            apiBooks = await window.BookAPI.getBooks();
        } else {
            const res = await fetch("/api/books");
            if (res.ok) {
                const data = await res.json();
                apiBooks = Array.isArray(data) ? data : (data.results || []);
            }
        }

        // Also merge any local books saved in localStorage
        try {
            const localCustom = JSON.parse(localStorage.getItem('user_uploaded_books') || '[]');
            if (Array.isArray(localCustom)) {
                apiBooks = [...localCustom, ...apiBooks];
            }
        } catch (e) {}

        if (Array.isArray(apiBooks) && apiBooks.length > 0) {
            let addedCount = 0;
            apiBooks.forEach((ab) => {
                if (!ab || !ab.id) return;
                const existingIdx = books.findIndex(b => String(b.id) === String(ab.id));

                const isFree = ab.mode === "donate" || ab.type === "Donate" || Number(ab.price) === 0;
                const isExchange = ab.mode === "exchange" || ab.type === "Exchange";

                const defaultCover = window.DEFAULT_BOOK_COVER || "browse_images/books/book1.jpg";
                const bookCover = ab.cover || ab.image || ab.cover_url || defaultCover;

                const sellerData = ab.seller || (ab.seller_details ? {
                    name: ab.seller_details.full_name || ab.seller_name || "Student Seller",
                    email: ab.seller_details.email || "student@rcti.ac.in",
                    whatsapp: ab.seller_details.whatsapp || "+919876543210"
                } : {
                    name: ab.seller_name || "Student Seller",
                    email: "student@rcti.ac.in",
                    whatsapp: "+919876543210"
                });

                const normalized = {
                    id: ab.id,
                    title: ab.title || "Untitled Book",
                    author: ab.author || "Student Contributor",
                    department: ab.branch || ab.department || "Computer Engineering",
                    semester: Number(ab.semester) || 1,
                    category: ab.genre || ab.category || ab.subject || "Programming",
                    condition: ab.condition || "Good",
                    price: isFree ? 0 : Number(ab.price || 0),
                    type: isFree ? "Donate" : (isExchange ? "Exchange" : "Sell"),
                    image: bookCover,
                    cover: bookCover,
                    seller: sellerData,
                    description: ab.description || "",
                    location: ab.location || "Campus Central Library",
                    isUserListed: true
                };

                if (existingIdx >= 0) {
                    books[existingIdx] = { ...books[existingIdx], ...normalized };
                } else {
                    // Prepend user-listed books so visitors see them at the top of the catalog
                    books.unshift(normalized);
                    addedCount++;
                }
            });

            // Re-render catalog with live user-listed books
            if (typeof applyFilters === "function") {
                applyFilters();
            } else if (typeof renderBooks === "function") {
                renderBooks(books);
            }
        }
    } catch (err) {
        console.warn("Could not load live user-listed books from backend:", err);
    }
}
