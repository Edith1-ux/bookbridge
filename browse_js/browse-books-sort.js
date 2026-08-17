
/* ==========================================
   BookBridge - Browse Books Sort
========================================== */

/* ==========================================
   Sort Books
========================================== */

function sortBooks(bookList) {
    const sortEl = document.getElementById("sortBooks");
    const sortOption = sortEl ? sortEl.value : "default";

    // Create Copy Of Book List
    let sortedBooks = [...(bookList || [])];

    /* ==========================================
       Sort : Name (A - Z)
    ========================================== */

    if (sortOption === "titleAZ") {
        sortedBooks.sort((a, b) =>
            (a.title || "").localeCompare(b.title || "")
        );
    }

    /* ==========================================
       Sort : Name (Z - A)
    ========================================== */

    else if (sortOption === "titleZA") {
        sortedBooks.sort((a, b) =>
            (b.title || "").localeCompare(a.title || "")
        );
    }

    /* ==========================================
       Sort : Price (Low - High)
    ========================================== */

    else if (sortOption === "priceLowHigh") {
        sortedBooks.sort((a, b) =>
            (Number(a.price) || 0) - (Number(b.price) || 0)
        );
    }

    /* ==========================================
       Sort : Price (High - Low)
    ========================================== */

    else if (sortOption === "priceHighLow") {
        sortedBooks.sort((a, b) =>
            (Number(b.price) || 0) - (Number(a.price) || 0)
        );
    }

    // Return Sorted Books
    return sortedBooks;
}

/* ==========================================
   Sort Dropdown Event
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const sortEl = document.getElementById("sortBooks");
    if (sortEl) {
        sortEl.addEventListener("change", applyFilters);
    }
});





