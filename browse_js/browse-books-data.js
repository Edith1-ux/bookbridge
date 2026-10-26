/* ==========================================
   BookBridge - Browse Books Data
========================================== */

const books = [

    {
        id: 1,
        title: "Computer Programming",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 1,
        category: "Programming",
        condition: "Like New",
        price: 320,
        type: "Sell",
        image: "browse_images/books/book1.jpg"
    },

    {
        id: 2,
        title: "Engineering Mathematics-I",
        author: "Atul Prakashan",
        department: "Mathematics",
        semester: 1,
        category: "Mathematics",
        condition: "Good",
        price: 250,
        type: "Sell",
        image: "browse_images/books/book2.jpg"
    },

    {
        id: 3,
        title: "Applied Physics",
        author: "Atul Prakashan",
        department: "Science & Humanities",
        semester: 1,
        category: "Science",
        condition: "Excellent",
        price: 280,
        type: "Sell",
        image: "browse_images/books/book3.jpg"
    },

    {
        id: 4,
        title: "Applied Chemistry",
        author: "Atul Prakashan",
        department: "Science & Humanities",
        semester: 1,
        category: "Science",
        condition: "Good",
        price: 260,
        type: "Donate",
        image: "browse_images/books/book4.jpg"
    },

    {
        id: 5,
        title: "Basic Electrical Engineering",
        author: "Atul Prakashan",
        department: "Electrical Engineering",
        semester: 1,
        category: "Engineering",
        condition: "Fair",
        price: 200,
        type: "Sell",
        image: "browse_images/books/book5.jpg"
    },

    {
        id: 6,
        title: "Engineering Graphics",
        author: "Atul Prakashan",
        department: "Mechanical Engineering",
        semester: 1,
        category: "Engineering",
        condition: "Like New",
        price: 390,
        type: "Sell",
        image: "browse_images/books/book6.jpg"
    },

    {
        id: 7,
        title: "Environmental Studies",
        author: "Atul Prakashan",
        department: "Science & Humanities",
        semester: 2,
        category: "Science",
        condition: "Excellent",
        price: 180,
        type: "Donate",
        image: "browse_images/books/book7.jpg"
    },

    {
        id: 8,
        title: "Programming in java",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 4,
        category: "Programming",
        condition: "Good",
        price: 300,
        type: "Sell",
        image: "browse_images/books/book8.jpg"
    },

    {
        id: 9,
        title: "Digital Electronics",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 2,
        category: "Electronics",
        condition: "Like New",
        price: 350,
        type: "Sell",
        image: "browse_images/books/book9.jpg"
    },


        {
        id: 10,
        title: "Communication Skills",
        author: "Atul Prakashan",
        department: "Science & Humanities",
        semester: 2,
        category: "Communication Skills",
        condition: "Excellent",
        price: 150,
        type: "Donate",
        image: "browse_images/books/book10.jpg"
    },

    {
        id: 11,
        title: "Data Structures",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 3,
        category: "Programming",
        condition: "Good",
        price: 380,
        type: "Sell",
        image: "browse_images/books/book11.jpg"
    },

    {
        id: 12,
        title: "Database Management System",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 3,
        category: "Programming",
        condition: "Excellent",
        price: 420,
        type: "Sell",
        image: "browse_images/books/book12.jpg"
    },

    {
        id: 13,
        title: "Responsive Web Page Design",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 3,
        category: "Programming",
        condition: "Like New",
        price: 350,
        type: "Sell",
        image: "browse_images/books/book13.jpg"
    },

    {
        id: 14,
        title: "Computer Organization",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 3,
        category: "Engineering",
        condition: "Good",
        price: 0,
        type: "Donate",
        image: "browse_images/books/book14.jpg"
    },

    {
        id: 15,
        title: "Operating System",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 4,
        category: "Programming",
        condition: "Excellent",
        price: 450,
        type: "Sell",
        image: "browse_images/books/book15.jpg"
    },

    {
        id: 16,
        title: "Computer Networks",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 4,
        category: "Networking",
        condition: "Good",
        price: 390,
        type: "Sell",
        image: "browse_images/books/book16.jpg"
    },

    {
        id: 17,
        title: "Python Programming",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 4,
        category: "Programming",
        condition: "Like New",
        price: 480,
        type: "Sell",
        image: "browse_images/books/book17.jpg"
    },

        {
        id: 18,
        title: "Cloud Computing",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 5,
        category: "Networking",
        condition: "Excellent",
        price: 520,
        type: "Sell",
        image: "browse_images/books/book18.jpg"
    },

    {
        id: 19,
        title: "Information Security",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 5,
        category: "Networking",
        condition: "Good",
        price: 0,
        type: "Donate",
        image: "browse_images/books/book19.jpg"
    },

    {
        id: 20,
        title: "Artificial Intelligence",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 5,
        category: "Programming",
        condition: "Like New",
        price: 650,
        type: "Sell",
        image: "browse_images/books/book20.jpg"
    },

    {
        id: 21,
        title: "Machine Learning",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 6,
        category: "Programming",
        condition: "Excellent",
        price: 700,
        type: "Sell",
        image: "browse_images/books/book21.jpg"
    },

    {
        id: 22,
        title: "Internet of Things",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 6,
        category: "Networking",
        condition: "Good",
        price: 550,
        type: "Sell",
        image: "browse_images/books/book22.jpg"
    },

    {
        id: 23,
        title: "Project Management",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 6,
        category: "Others",
        condition: "Fair",
        price: 250,
        type: "Sell",
        image: "browse_images/books/book23.jpg"
    },

    {
        id: 24,
        title: "Software Engineering",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 4,
        category: "Programming",
        condition: "Excellent",
        price: 0,
        type: "Donate",
        image: "browse_images/books/book24.jpg"
    },

    {
        id: 25,
        title: "Mobile Application Development",
        author: "Atul Prakashan",
        department: "Computer Engineering",
        semester: 6,
        category: "Programming",
        condition: "Like New",
        price: 600,
        type: "Sell",
        image: "browse_images/books/book25.jpg"
    }

];

/* ==========================================
   Load Admin Edited Catalog / User Uploads from LocalStorage
========================================== */
try {
    const adminEdited = JSON.parse(localStorage.getItem("admin_edited_catalog") || "[]");
    if (Array.isArray(adminEdited) && adminEdited.length > 0 && adminEdited[0] && adminEdited[0].title) {
        books.length = 0;
        books.push(...adminEdited);
    } else {
        const userUploaded = JSON.parse(localStorage.getItem("user_uploaded_books") || "[]");
        if (Array.isArray(userUploaded) && userUploaded.length > 0) {
            userUploaded.forEach(ub => {
                if (ub && ub.id && !books.some(b => String(b.id) === String(ub.id))) {
                    books.unshift(ub);
                }
            });
        }
    }
    // Guarantee every book has a valid image / cover fallback
    books.forEach(b => {
        if (!b.image && b.cover) b.image = b.cover;
        if (!b.cover && b.image) b.cover = b.image;
    });
} catch (err) {
    console.error("Failed to load catalog from localStorage:", err);
}

/* ==========================================
   End of Book Data
========================================== */


