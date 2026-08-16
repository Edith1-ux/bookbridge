
/* ==========================================
   BookBridge - Browse Books Search
========================================== */

/* ==========================================
   Search Books
========================================== */

function searchBooks() {

    // Apply Search, Filters and Sorting
    applyFilters();

}

/* ==========================================
   Search Event
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", searchBooks);
    }
});

