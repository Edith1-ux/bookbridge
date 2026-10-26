/* ==========================================
   BookBridge - Admin Photo & Book Management
========================================== */

let isAdminMode = localStorage.getItem("admin_mode") === "true";

document.addEventListener("DOMContentLoaded", () => {
    const adminToggleBtn = document.getElementById("adminToggleBtn");
    const adminBadge = document.getElementById("adminBadge");
    const editBookForm = document.getElementById("editBookForm");
    const editImageFile = document.getElementById("editImageFile");
    const editImagePreview = document.getElementById("editImagePreview");

    let editedBase64Image = "";

    // Sync Admin UI State on Load
    function syncAdminUI() {
        if (adminBadge) {
            if (isAdminMode) {
                adminBadge.classList.remove("d-none");
            } else {
                adminBadge.classList.add("d-none");
            }
        }
        if (adminToggleBtn) {
            if (isAdminMode) {
                adminToggleBtn.innerHTML = '<i class="bi bi-shield-x me-1"></i> Exit Admin Mode';
                adminToggleBtn.className = 'btn btn-danger btn-sm';
            } else {
                adminToggleBtn.innerHTML = '<i class="bi bi-shield-lock me-1"></i> Admin Access';
                adminToggleBtn.className = 'btn btn-outline-danger btn-sm';
            }
        }
    }

    // Toggle Admin Mode
    if (adminToggleBtn) {
        adminToggleBtn.addEventListener("click", () => {
            if (!isAdminMode) {
                const pass = prompt("Enter Admin Security Passcode (Default: admin123):");
                if (pass === "admin123" || pass === "admin") {
                    isAdminMode = true;
                    localStorage.setItem("admin_mode", "true");
                    alert("🔓 Admin Edit Mode Activated! You can now edit/replace cover photos and delete books.");
                } else if (pass !== null) {
                    alert("❌ Incorrect Admin Passcode.");
                    return;
                }
            } else {
                isAdminMode = false;
                localStorage.setItem("admin_mode", "false");
                alert("🔒 Admin Mode Exited.");
            }

            syncAdminUI();
            if (typeof applyFilters === "function") {
                applyFilters();
            } else if (typeof renderBooks === "function") {
                renderBooks(books);
            }
        });
    }

    // Listen for Edit / Replace Photo & Delete Button Clicks on Books Container
    const booksContainer = document.getElementById("booksContainer");
    if (booksContainer) {
        booksContainer.addEventListener("click", (e) => {
            // Admin Delete Button Clicked
            const delBtn = e.target.closest(".admin-delete-btn");
            if (delBtn) {
                const rawId = delBtn.getAttribute("data-id");
                const bookIndex = books.findIndex(b => String(b.id) === String(rawId));
                if (bookIndex === -1) return;

                if (confirm(`Are you sure you want to delete "${books[bookIndex].title}" from the catalog?`)) {
                    books.splice(bookIndex, 1);
                    persistCatalogChanges();
                    if (typeof applyFilters === "function") applyFilters();
                    alert("🗑️ Book removed successfully by Admin.");
                }
                return;
            }

            // Admin Edit Button Clicked
            const editBtn = e.target.closest(".admin-edit-btn");
            if (editBtn) {
                const rawId = editBtn.getAttribute("data-id");
                const book = books.find(b => String(b.id) === String(rawId));
                if (!book) return;

                document.getElementById("editBookId").value = book.id;
                document.getElementById("editTitle").value = book.title || "";
                document.getElementById("editAuthor").value = book.author || "";
                document.getElementById("editDepartment").value = book.department || book.branch || "";
                document.getElementById("editSemester").value = book.semester || 1;
                document.getElementById("editCategory").value = book.category || book.genre || "";
                document.getElementById("editType").value = book.type || (book.mode === "donate" ? "Donate" : "Sell");
                document.getElementById("editCondition").value = book.condition || "Good";
                document.getElementById("editPrice").value = book.price || 0;

                editedBase64Image = ""; // Reset file selection
                if (editImagePreview) {
                    const fallback = window.DEFAULT_BOOK_COVER || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420' width='300' height='420'%3E%3Crect width='300' height='420' rx='12' fill='%231e3a8a'/%3E%3Ctext x='150' y='210' font-size='48' fill='%23fff' text-anchor='middle'%3E📚%3C/text%3E%3C/svg%3E";
                    editImagePreview.src = book.image || book.cover || fallback;
                    editImagePreview.onerror = function() { this.onerror = null; this.src = fallback; };
                }

                const editModalEl = document.getElementById("editBookModal");
                if (editModalEl && typeof bootstrap !== "undefined") {
                    const modal = bootstrap.Modal.getOrCreateInstance(editModalEl);
                    modal.show();
                }
            }
        });
    }

    // New Image Selection Preview for Admin Edit Modal
    if (editImageFile) {
        editImageFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                editedBase64Image = event.target.result;
                if (editImagePreview) editImagePreview.src = editedBase64Image;
            };
            reader.readAsDataURL(file);
        });
    }

    // Submit Admin Edit Form
    if (editBookForm) {
        editBookForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const bookId = Number(document.getElementById("editBookId").value);
            const book = books.find(b => b.id === bookId);
            if (!book) return;

            book.title = document.getElementById("editTitle").value.trim();
            book.author = document.getElementById("editAuthor").value.trim();
            book.department = document.getElementById("editDepartment").value;
            book.semester = Number(document.getElementById("editSemester").value);
            book.category = document.getElementById("editCategory").value;
            book.type = document.getElementById("editType").value;
            book.condition = document.getElementById("editCondition").value;
            book.price = Number(document.getElementById("editPrice").value);

            // Replace cover photo if Admin selected a new image
            if (editedBase64Image) {
                book.image = editedBase64Image;
            }

            persistCatalogChanges();

            if (typeof applyFilters === "function") {
                applyFilters();
            } else if (typeof renderBooks === "function") {
                renderBooks(books);
            }

            const editModalEl = document.getElementById("editBookModal");
            if (editModalEl && typeof bootstrap !== "undefined") {
                const modal = bootstrap.Modal.getInstance(editModalEl);
                if (modal) modal.hide();
            }

            alert(`✅ Success! "${book.title}" details and cover photo updated by Admin.`);
        });
    }

    // Helper to persist edits in localStorage
    function persistCatalogChanges() {
        try {
            localStorage.setItem("admin_edited_catalog", JSON.stringify(books));
        } catch (err) {
            console.error("Failed to save catalog updates:", err);
        }
    }

    syncAdminUI();
});
