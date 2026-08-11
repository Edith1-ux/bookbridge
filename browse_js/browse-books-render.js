
/* ==========================================
   BookBridge - Browse Books Render
========================================== */

/* ==========================================
   Render Books Function
========================================== */

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderBooks(bookList = books) {

    // Get the Books Container
    const booksContainer = document.getElementById("booksContainer");

    // Get the Book Count Element
    const bookCount = document.getElementById("bookCount");

    // Clear Previous Books
    booksContainer.innerHTML = "";

    // Update Total Books Count
    bookCount.textContent = bookList.length;

    // If No Books Are Available
    if (bookList.length === 0) {

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
        const priceText =
            book.type === "Donate"
                ? "Donate"
                : `₹${book.price}`;

        // Create Book Card
        const bookCard = `

            <div class="col-12 col-sm-6 col-md-4 col-lg-3 book-column">

                <div class="book-card">

                    <!-- Book Image -->
                    <img
                        src="${escapeHTML(book.image)}"
                        alt="${escapeHTML(book.title)}"
                        class="book-image"
                        onerror="if(!this.dataset.tried){this.dataset.tried='1'; this.src='./'+'${escapeHTML(book.image)}';}">

                    <div class="book-content">

                        <!-- Book Badges -->
                        <div class="book-badges">

                            <span>${escapeHTML(book.department)}</span>

                            <span>Sem ${escapeHTML(book.semester)}</span>

                            <span>${escapeHTML(book.category)}</span>

                        </div>

                        <!-- Book Title -->
                        <h5 class="book-title">

                            ${escapeHTML(book.title)}

                        </h5>

                        <!-- Book Author -->
                        <p class="book-author">

                            ${escapeHTML(book.author)}

                        </p>

                        <!-- Book Price -->
                        <div class="book-price">

                            ${escapeHTML(priceText)}

                        </div>

                        <!-- Book Condition -->
                        <div class="book-condition">

                            ${escapeHTML(book.condition)}

                        </div>

                        <!-- View Details & Admin Actions -->
                        <div class="d-flex gap-2 align-items-center mt-2 flex-wrap">
                            <button
                                class="view-btn flex-grow-1"
                                data-id="${book.id}">
                                View Details
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

/* ==========================================
   View Details Modal Event Listener
========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const booksContainer = document.getElementById("booksContainer");
    if (booksContainer) {
        booksContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".view-btn");
            if (!btn) return;

            const bookId = Number(btn.getAttribute("data-id"));
            const book = books.find(b => b.id === bookId);
            if (!book) return;

            const modalImg = document.getElementById("modalBookImage");
            if (modalImg) { modalImg.src = book.image; modalImg.alt = book.title; }

            const titleEl = document.getElementById("modalBookTitle");
            if (titleEl) titleEl.textContent = book.title;

            const authorEl = document.getElementById("modalBookAuthor");
            if (authorEl) authorEl.textContent = book.author;

            const deptEl = document.getElementById("modalBookDepartment");
            if (deptEl) deptEl.textContent = book.department;

            const semEl = document.getElementById("modalBookSemester");
            if (semEl) semEl.textContent = `Semester ${book.semester}`;

            const catEl = document.getElementById("modalBookCategory");
            if (catEl) catEl.textContent = book.category;

            const condEl = document.getElementById("modalBookCondition");
            if (condEl) condEl.textContent = book.condition;

            const typeEl = document.getElementById("modalBookType");
            if (typeEl) typeEl.textContent = book.type;

            const priceEl = document.getElementById("modalBookPrice");
            if (priceEl) priceEl.textContent = book.type === "Donate" ? "Free (Donate)" : `₹${book.price}`;

            const modalElement = document.getElementById("bookDetailsModal");
            if (modalElement && typeof bootstrap !== "undefined") {
                const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        });
    }
});
