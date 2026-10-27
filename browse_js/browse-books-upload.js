/* ==========================================
   BookBridge - Upload & Exchange Offer Logic
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadBookForm");
    const mrpInput = document.getElementById("uploadOriginalPrice");
    const conditionSelect = document.getElementById("uploadCondition");
    const typeSelect = document.getElementById("uploadType");
    const calculatedPriceEl = document.getElementById("calculatedPrice");
    const finalPriceInput = document.getElementById("finalPrice");
    const priceCalcExplain = document.getElementById("priceCalcExplain");
    const imageFileInput = document.getElementById("uploadImageFile");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const mrpContainer = document.getElementById("mrpContainer");
    const priceCalculatorBox = document.getElementById("priceCalculatorBox");

    let uploadedBase64Image = "";

    // Condition Multipliers for Exchange Offer Price Calculation
    const conditionMultipliers = {
        "Like New": { rate: 0.80, label: "80% of MRP" },
        "Excellent": { rate: 0.65, label: "65% of MRP" },
        "Good": { rate: 0.50, label: "50% of MRP" },
        "Fair": { rate: 0.35, label: "35% of MRP" }
    };

    // Calculate Exchange Price Automatically based on Condition & Original MRP
    function updateExchangePrice() {
        if (!typeSelect) return;
        const offerType = typeSelect.value;
        if (offerType === "Donate") {
            if (mrpContainer) mrpContainer.style.display = "none";
            if (priceCalculatorBox) priceCalculatorBox.style.display = "none";
            if (calculatedPriceEl) calculatedPriceEl.textContent = "Free (Donate)";
            if (finalPriceInput) finalPriceInput.value = 0;
            return;
        } else {
            if (mrpContainer) mrpContainer.style.display = "block";
            if (priceCalculatorBox) priceCalculatorBox.style.display = "block";
        }

        const mrp = Number(mrpInput ? mrpInput.value : 0) || 0;
        const condition = conditionSelect ? conditionSelect.value : "Good";
        const info = conditionMultipliers[condition] || conditionMultipliers["Good"];

        const estPrice = Math.round(mrp * info.rate);
        if (calculatedPriceEl) calculatedPriceEl.textContent = `₹${estPrice}`;
        if (finalPriceInput) finalPriceInput.value = estPrice;
        if (priceCalcExplain) priceCalcExplain.textContent = `Based on condition "${condition}" (${info.label})`;
    }

    if (mrpInput) mrpInput.addEventListener("input", updateExchangePrice);
    if (conditionSelect) conditionSelect.addEventListener("change", updateExchangePrice);
    if (typeSelect) typeSelect.addEventListener("change", updateExchangePrice);

    // Image File Selection & Preview
    if (imageFileInput) {
        imageFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                uploadedBase64Image = event.target.result;
                if (imagePreview) imagePreview.src = uploadedBase64Image;
                if (imagePreviewContainer) imagePreviewContainer.classList.remove("d-none");
            };
            reader.readAsDataURL(file);
        });
    }

    // Handle Form Submission (Add New Book to Catalog & Save to LocalStorage)
    if (uploadForm) {
        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // STRICT AUTH GATE: Do not allow guests to list or sell books
            const currentUser = JSON.parse(localStorage.getItem('rcti_gtu_current_user') || 'null');
            const token = localStorage.getItem('bb_access_token');
            if (!currentUser && !token) {
                e.stopPropagation();

                // Close modal
                const modalEl = document.getElementById("uploadBookModal");
                if (modalEl && typeof bootstrap !== "undefined") {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }

                if (typeof window.showAuthPrompt === "function") {
                    window.showAuthPrompt(
                        "Student Login Required to List Books",
                        "You must be signed in with your college account to sell or exchange textbooks. Please login or register to publish your books on campus.",
                        "login.html?redirect=browse.html"
                    );
                } else {
                    alert("Please login with your student account to upload books.");
                    window.location.href = "login.html?redirect=browse.html";
                }
                return;
            }

            const title = document.getElementById("uploadTitle").value.trim();
            const author = document.getElementById("uploadAuthor").value.trim();
            const department = document.getElementById("uploadDepartment").value;
            const semester = Number(document.getElementById("uploadSemester").value);
            const category = document.getElementById("uploadCategory").value;
            const offerType = typeSelect.value;
            const condition = conditionSelect.value;
            const price = offerType === "Donate" ? 0 : Number(finalPriceInput.value);

            const finalImage = uploadedBase64Image || window.DEFAULT_BOOK_COVER || "browse_images/books/book1.jpg";

            const sellerInfo = {
                id: currentUser ? (currentUser.id || 'usr-1') : 'usr-student',
                name: currentUser ? (currentUser.name || currentUser.full_name || 'Student Seller') : 'Student Seller',
                email: currentUser ? (currentUser.email || 'student@rcti.edu') : 'student@rcti.edu',
                role: currentUser ? (currentUser.role || 'student') : 'student',
                whatsapp: currentUser ? (currentUser.whatsapp || '+919876543210') : '+919876543210',
                branch: currentUser ? (currentUser.branch || department) : department
            };

            const newBook = {
                id: Date.now(),
                title: title,
                author: author,
                department: department,
                semester: semester,
                category: category,
                condition: condition,
                price: price,
                type: offerType,
                image: finalImage,
                cover: finalImage,
                seller: sellerInfo,
                isUserListed: true
            };

            // Prepend new book to global books array
            books.unshift(newBook);

            // Persist user uploaded books in localStorage
            try {
                const existingCustom = JSON.parse(localStorage.getItem("user_uploaded_books") || "[]");
                existingCustom.unshift(newBook);
                localStorage.setItem("user_uploaded_books", JSON.stringify(existingCustom));
            } catch (err) {
                console.error("Failed to save book to localStorage:", err);
            }

            // Sync to backend API (/api/books/) for campus-wide visibility
            if (window.BookAPI && typeof window.BookAPI.addBook === "function") {
                try {
                    await window.BookAPI.addBook({
                        title: title,
                        author: author,
                        branch: department,
                        semester: semester,
                        genre: category,
                        subject: category,
                        condition: condition,
                        price: price,
                        mode: offerType === 'Donate' ? 'donate' : (offerType === 'Exchange' ? 'exchange' : 'sell'),
                        location: 'Campus Central Library',
                        resource_type: 'Textbook'
                    });
                } catch (apiErr) {
                    console.warn("Backend API sync warning:", apiErr);
                }
            }

            // Sync to unified BookDB / localStorage for dashboard & exchange integration
            try {
                const unifiedBook = {
                    id: 'bk-' + newBook.id,
                    title: title,
                    author: author,
                    branch: department,
                    semester: semester,
                    genre: category,
                    condition: condition,
                    price: price,
                    mode: offerType === 'Donate' ? 'donate' : 'exchange',
                    cover: uploadedBase64Image,
                    status: 'available',
                    category: 'physical',
                    seller: sellerInfo,
                    createdAt: new Date().toISOString()
                };

                const existingUnified = JSON.parse(localStorage.getItem('rcti_gtu_lab_manual_books') || '[]');
                existingUnified.unshift(unifiedBook);
                localStorage.setItem('rcti_gtu_lab_manual_books', JSON.stringify(existingUnified));
            } catch (err) {
                console.error("Failed to sync unified book catalog:", err);
            }

            // Increment Live Counter Stats (Books & Exchanges)
            if (typeof incrementLiveStat === "function") {
                incrementLiveStat("books", 1);
                incrementLiveStat("exchanges", 1);
            }

            // Re-render books grid
            if (typeof applyFilters === "function") {
                applyFilters();
            } else if (typeof renderBooks === "function") {
                renderBooks(books);
            }

            // Close Modal & Reset Form
            const modalEl = document.getElementById("uploadBookModal");
            if (modalEl && typeof bootstrap !== "undefined") {
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            }

            uploadForm.reset();
            if (imagePreviewContainer) imagePreviewContainer.classList.add("d-none");
            uploadedBase64Image = "";
            updateExchangePrice();

            // Scroll to books section
            const booksSec = document.getElementById("books-section");
            if (booksSec) booksSec.scrollIntoView({ behavior: "smooth" });

            // Success Notification
            alert(`🎉 Success! "${title}" has been listed on campus by ${sellerInfo.name} with an offer price of ₹${price}.`);
        });
    }

    // Initialize initial calculation
    updateExchangePrice();
});
