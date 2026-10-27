
/* ==========================================
   BookBridge - Main JavaScript
========================================== */

/* ==========================================
   Initialize Browse Books Page
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync User Session in Navbar
    syncBrowseNavUser();

    // 2. Display Books With Current Filters & Sort
    if (typeof applyFilters === "function") {
        applyFilters();
    } else if (typeof renderBooks === "function") {
        renderBooks(books);
    }
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

