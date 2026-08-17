
/* ==========================================
   BookBridge - Browse Books Filter
========================================== */

/* ==========================================
   Apply Selected Filters
========================================== */

function applyFilters() {

    // Create Copy Of Books Array
    let filteredBooks = [...books];

    /* ==========================================
       Get Search Value & Selected Filters
    ========================================== */
    const searchInput = document.getElementById("searchInput");
    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const categoryEl = document.getElementById("categoryFilter");
    const category = categoryEl ? categoryEl.value : "";

    const departmentEl = document.getElementById("departmentFilter");
    const department = departmentEl ? departmentEl.value : "";

    const semesterEl = document.getElementById("semesterFilter");
    const semester = semesterEl ? semesterEl.value : "";

    const conditionEl = document.getElementById("conditionFilter");
    const condition = conditionEl ? conditionEl.value : "";

    const priceRangeEl = document.getElementById("priceRange");
    const maxPrice = (priceRangeEl && !isNaN(Number(priceRangeEl.value)) && Number(priceRangeEl.value) > 0) ? Number(priceRangeEl.value) : 2000;

    /* ==========================================
       Search Filter
    ========================================== */

    if (searchValue) {

        filteredBooks = filteredBooks.filter(book =>

            book.title.toLowerCase().includes(searchValue) ||

            book.author.toLowerCase().includes(searchValue) ||

            book.department.toLowerCase().includes(searchValue) ||

            book.category.toLowerCase().includes(searchValue)

        );

    }

    /* ==========================================
       Category Filter
    ========================================== */

    if (category) {

        filteredBooks = filteredBooks.filter(book =>

            book.category === category

        );

    }

    /* ==========================================
       Department Filter
    ========================================== */

    if (department) {

        filteredBooks = filteredBooks.filter(book =>

            book.department === department

        );

    }

    /* ==========================================
       Semester Filter
    ========================================== */

    if (semester) {

        filteredBooks = filteredBooks.filter(book =>

            book.semester.toString() === semester

        );

    }

    /* ==========================================
       Condition Filter
    ========================================== */

    if (condition) {

        filteredBooks = filteredBooks.filter(book =>

            book.condition === condition

        );

    }

    /* ==========================================
       Price Filter
    ========================================== */

    filteredBooks = filteredBooks.filter(book =>

        book.type === "Donate" ||

        book.price <= maxPrice

    );

    /* ==========================================
       Sort Books
    ========================================== */

    filteredBooks = sortBooks(filteredBooks);

    /* ==========================================
       Display Books
    ========================================== */

    renderBooks(filteredBooks);

}

/* ==========================================
   Clear All Filters
========================================== */

function clearFilters() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    const catEl = document.getElementById("categoryFilter");
    if (catEl) catEl.value = "";

    const deptEl = document.getElementById("departmentFilter");
    if (deptEl) deptEl.value = "";

    const semEl = document.getElementById("semesterFilter");
    if (semEl) semEl.value = "";

    const condEl = document.getElementById("conditionFilter");
    if (condEl) condEl.value = "";

    const prEl = document.getElementById("priceRange");
    if (prEl) prEl.value = 1200;

    const pvEl = document.getElementById("priceValue");
    if (pvEl) pvEl.textContent = "₹1200";

    // Display All Books
    let filteredBooks = [...books];
    if (typeof sortBooks === "function") {
        filteredBooks = sortBooks(filteredBooks);
    }
    if (typeof renderBooks === "function") {
        renderBooks(filteredBooks);
    }
}

/* ==========================================
   Attach Filter Events Safely on DOM Loaded
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const applyBtn = document.getElementById("applyFilterBtn");
    if (applyBtn) {
        applyBtn.addEventListener("click", applyFilters);
    }

    const clearBtn = document.getElementById("clearFilterBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearFilters);
    }

    const priceRange = document.getElementById("priceRange");
    const priceValue = document.getElementById("priceValue");
    if (priceRange && priceValue) {
        priceRange.addEventListener("input", () => {
            priceValue.textContent = `₹${priceRange.value}`;
        });
    }
});
