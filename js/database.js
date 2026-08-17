/**
 * ==========================================================================
 * OFFICIAL RCTI DATABASE ENGINE (MY UPLOADS & REAL-TIME SYNC)
 * ==========================================================================
 */

const STORAGE_KEY_BOOKS = 'rcti_gtu_lab_manual_books';
const STORAGE_KEY_USERS = 'rcti_gtu_users';
const STORAGE_KEY_CURRENT_USER = 'rcti_gtu_current_user';
const STORAGE_KEY_OFFERS = 'rcti_gtu_offers';
const STORAGE_KEY_TRANSACTIONS = 'rcti_gtu_txs';
const STORAGE_KEY_WISHLIST = 'rcti_gtu_wishlist';
const STORAGE_KEY_MESSAGES = 'rcti_gtu_messages';
const STORAGE_KEY_REVIEWS = 'rcti_gtu_reviews';
const STORAGE_KEY_POSTS = 'rcti_gtu_community_posts';

const SEED_USERS = [
  {
    id: 'usr-keval',
    name: 'Keval A. Prajapati (Group Lead)',
    enrollment: '246400307192',
    email: 'keval.ce@rcti.ac.in',
    branch: 'CE',
    semester: 5,
    division: 'Div A',
    academicYear: '2025-2026',
    whatsapp: '+919876543210',
    role: 'student',
    createdAt: '2026-07-20T08:00:00Z'
  }
];

const SEED_BOOKS = [
  {
    id: 'rcti-lab-1',
    category: 'digital',
    title: 'GTU DATA STRUCTURES (DS: 3330704) PRACTICAL LAB MANUAL',
    author: 'RCTI COMPUTER ENGG DEPT',
    isbn: 'GTU-3330704-LAB',
    gtuCode: '3330704',
    resourceType: 'lab_manual',
    genre: 'Computer Science',
    subject: 'Computer Science',
    semester: 3,
    branch: 'CE',
    edition: 'Latest Edition',
    publisher: 'RCTI Dept Portal',
    condition: 'Like New',
    language: 'English',
    mode: 'donate',
    price: 0,
    original: 450,
    rating: 4.8,
    exchangeFor: '',
    description: 'Official GTU Practical Lab Manual from RCTI Computer Dept portal. Contains 20+ completed C practical programs on Stacks, Queues, Linked Lists, Trees, and Sorting.',
    pdfUrl: 'https://webrcticomp.wixsite.com/rcticomputer',
    contactPreference: 'Both',
    cover: 'https://images.unsplash.com/photo-1515879218367-8466d910a373?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-admin', name: 'RCTI Comp Dept Lab Admin', rating: 5.0, email: 'admin@rcti.ac.in', whatsapp: '+919876543210', role: 'admin' },
    location: 'RCTI Computer Lab 1 & 2',
    status: 'Available',
    viewsCount: 42,
    wishlistCount: 15,
    createdAt: '2026-07-20T10:00:00Z'
  },
  {
    id: 'rcti-1',
    category: 'physical',
    title: 'DATA STRUCTURES IN C (GTU CODE: 3330704)',
    author: 'ATUL PRAKASHAN / MAHAJAN',
    isbn: 'GTU-3330704',
    gtuCode: '3330704',
    resourceType: 'textbook',
    genre: 'Computer Science',
    subject: 'Computer Science',
    semester: 3,
    branch: 'CE',
    edition: '3rd Edition',
    publisher: 'Atul Prakashan',
    condition: 'Like New',
    language: 'English',
    mode: 'exchange',
    price: 0,
    original: 650,
    rating: 4.7,
    exchangeFor: 'Swap for DBMS (3340701) or Operating Systems',
    description: 'GTU 3rd Semester Computer Engineering & IT diploma textbook. Covers Pointers, Stacks, Queues, Linked Lists, Trees, and Graphs.',
    contactPreference: 'Both',
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-ved', name: 'Ved V. Patel (Group 05 Lead)', rating: 5.0, email: 'ved.ce@rcti.ac.in', whatsapp: '+919876543210', role: 'student' },
    location: 'RCTI CE Block, Room 204',
    status: 'Available',
    viewsCount: 28,
    wishlistCount: 8,
    createdAt: '2026-07-20T10:00:00Z'
  },
  {
    id: 'bb-algos-1',
    category: 'physical',
    title: 'Introduction to Algorithms',
    author: 'Cormen, Leiserson, Rivest',
    isbn: '978-0262033848',
    resourceType: 'textbook',
    genre: 'Computer Science',
    subject: 'Computer Science',
    semester: 5,
    branch: 'CE',
    edition: '3rd Edition',
    condition: 'Good',
    language: 'English',
    mode: 'sell',
    price: 950,
    original: 3200,
    rating: 4.8,
    description: 'Essential reference for algorithm design, graph theories, dynamic programming, and complexity analysis.',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-ved', name: 'Ved V. Patel', rating: 4.9, email: 'ved.ce@rcti.ac.in', whatsapp: '+919876543210', role: 'student' },
    location: 'RCTI Campus Library',
    status: 'Available',
    createdAt: '2026-07-21T09:00:00Z'
  },
  {
    id: 'bb-mech-2',
    category: 'physical',
    title: 'Engineering Mechanics: Statics',
    author: 'R.C. Hibbeler',
    resourceType: 'textbook',
    genre: 'Engineering',
    subject: 'Engineering',
    semester: 1,
    branch: 'ME',
    edition: '4th Edition',
    condition: 'Like New',
    language: 'English',
    mode: 'sell',
    price: 620,
    original: 1800,
    rating: 4.6,
    description: 'Comprehensive static equilibrium, vector analysis, and truss systems for diploma & degree engineers.',
    cover: 'https://images.unsplash.com/photo-1621955964441-c173e01fca5c?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-admin', name: 'RCTI Mech Dept Admin', rating: 4.8, email: 'admin@rcti.ac.in', whatsapp: '+919876543210', role: 'admin' },
    location: 'RCTI Mechanical Block',
    status: 'Available',
    createdAt: '2026-07-21T10:00:00Z'
  },
  {
    id: 'bb-calc-3',
    category: 'physical',
    title: 'Calculus: Early Transcendentals',
    author: 'James Stewart',
    resourceType: 'textbook',
    genre: 'Mathematics',
    subject: 'Mathematics',
    semester: 2,
    branch: 'EE',
    edition: '2nd Edition',
    condition: 'Fair',
    language: 'English',
    mode: 'exchange',
    price: 400,
    original: 1650,
    rating: 4.3,
    exchangeFor: 'Swap for Linear Algebra or Physics I',
    description: 'Integral calculus, differential equations, multivariable vectors and series expansion.',
    cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-ved', name: 'Ved V. Patel', rating: 4.7, email: 'ved.ce@rcti.ac.in', whatsapp: '+919876543210', role: 'student' },
    location: 'RCTI EE Block',
    status: 'Available',
    createdAt: '2026-07-21T11:00:00Z'
  },
  {
    id: 'bb-phys-5',
    category: 'physical',
    title: 'University Physics with Modern Physics',
    author: 'Young & Freedman',
    resourceType: 'textbook',
    genre: 'Physics',
    subject: 'Physics',
    semester: 1,
    branch: 'Civil',
    edition: 'Latest Edition',
    condition: 'Like New',
    language: 'English',
    mode: 'sell',
    price: 780,
    original: 2100,
    rating: 4.7,
    description: 'Electromagnetism, thermodynamics, optics, modern quantum physics fundamentals.',
    cover: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-admin', name: 'RCTI Physics Lab Admin', rating: 4.9, email: 'admin@rcti.ac.in', whatsapp: '+919876543210', role: 'admin' },
    location: 'RCTI Physics Lab',
    status: 'Available',
    createdAt: '2026-07-21T12:00:00Z'
  },
  {
    id: 'bb-chem-6',
    category: 'physical',
    title: 'Organic Chemistry Fundamental Principles',
    author: 'Clayden, Greeves, Warren',
    resourceType: 'textbook',
    genre: 'Chemistry',
    subject: 'Chemistry',
    semester: 2,
    branch: 'IC',
    edition: '2nd Edition',
    condition: 'Worn',
    language: 'English',
    mode: 'donate',
    price: 0,
    original: 1900,
    rating: 4.2,
    description: 'Donated text copy covering reaction mechanisms, stereochemistry, and organic syntheses.',
    cover: 'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-ved', name: 'Ved V. Patel', rating: 4.6, email: 'ved.ce@rcti.ac.in', whatsapp: '+919876543210', role: 'student' },
    location: 'RCTI Chemistry Lab',
    status: 'Available',
    createdAt: '2026-07-21T13:00:00Z'
  },
  {
    id: 'bb-python-7',
    category: 'physical',
    title: 'Python Crash Course',
    author: 'Eric Matthes',
    resourceType: 'textbook',
    genre: 'Computer Science',
    subject: 'Computer Science',
    semester: 4,
    branch: 'IT',
    edition: '3rd Edition',
    condition: 'Good',
    language: 'English',
    mode: 'sell',
    price: 550,
    original: 1500,
    rating: 4.9,
    description: 'Hands-on introduction to Python programming. Covers fundamentals, data visualization, web apps, and game development.',
    cover: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=400&q=80',
    seller: { id: 'usr-ved', name: 'Ved V. Patel', rating: 4.8, email: 'ved.ce@rcti.ac.in', whatsapp: '+919876543210', role: 'student', isVerified: true },
    location: 'RCTI IT Block',
    status: 'Available',
    createdAt: '2026-07-22T09:00:00Z'
  }
];

class OfficialRCTIDatabase {
  constructor() { this.isInitialized = false; }

  async init() {
    if (this.isInitialized) return;
    if (!localStorage.getItem(STORAGE_KEY_USERS)) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEY_BOOKS)) {
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(SEED_BOOKS));
    }
    if (!localStorage.getItem(STORAGE_KEY_OFFERS)) {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_WISHLIST)) {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_MESSAGES)) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_REVIEWS)) {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEY_POSTS)) {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify([]));
    }
    this.isInitialized = true;
  }

  async registerUser(userData) {
    await this.init();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Account already registered for this email.');
    }
    const role = 'student';

    let passwordHash = '';
    if (userData.password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(userData.password + 'bookbridge_salt_v1');
      if (window.crypto && window.crypto.subtle) {
        try {
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          passwordHash = 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch(e) {
          passwordHash = 'plain:' + userData.password;
        }
      } else {
        passwordHash = 'plain:' + userData.password;
      }
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: userData.name,
      enrollment: userData.enrollment || '',
      email: userData.email,
      passwordHash: passwordHash,
      branch: userData.branch || 'CE',
      semester: parseInt(userData.semester || 1),
      division: userData.division || 'Div A',
      academicYear: userData.academicYear || '2025-2026',
      whatsapp: userData.whatsapp || '',
      college: 'R. C. Technical Institute, Ahmedabad (GTU)',
      role: role,
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    const { passwordHash: _h, ...safeUser } = newUser;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(safeUser));
    return safeUser;
  }

  async verifyUser(userId) {
    await this.init();
    let users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    users = users.map(u => u.id === userId ? { ...u, isVerified: true } : u);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  async getExchangeMatches(bookId) {
    await this.init();
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    const targetBook = books.find(b => b.id === bookId);
    if (!targetBook || !targetBook.exchangeFor) return [];
    
    return books.filter(b => 
      b.mode === 'exchange' && 
      targetBook.exchangeFor.toLowerCase().includes(b.title.toLowerCase())
    );
  }

  async loginUser(email, password) {
    await this.init();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // FIX: No longer auto-creates accounts on login — returns null if user not found
    if (!user) {
      return null;
    }

    // FIX: Actually verify the password
    let passwordMatch = false;
    if (user.passwordHash && password) {
      if (user.passwordHash.startsWith('sha256:')) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'bookbridge_salt_v1');
        if (window.crypto && window.crypto.subtle) {
          try {
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const inputHash = 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            passwordMatch = (inputHash === user.passwordHash);
          } catch(e) {
            passwordMatch = false;
          }
        }
      } else if (user.passwordHash.startsWith('plain:')) {
        // Legacy fallback comparison
        passwordMatch = (user.passwordHash === 'plain:' + password);
      }
    }

    if (!passwordMatch) {
      return null; // Wrong password
    }

    // FIX: Never store passwordHash in session
    const { passwordHash: _h, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(safeUser));
    return safeUser;
  }

  async getCurrentUser() {
    await this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CURRENT_USER) || 'null');
  }

  async logoutUser() {
    await this.init();
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }

  async getAllUsers() {
    await this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
  }

  async deleteUser(userId) {
    await this.init();
    let users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  async getAdminStats() {
    await this.init();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || '[]');
    const offers = JSON.parse(localStorage.getItem(STORAGE_KEY_OFFERS) || '[]');

    return {
      totalUsers: users.length,
      totalListings: books.length,
      totalTransactions: transactions.length,
      totalOffers: offers.length,
      activeSwaps: books.filter(b => b.mode === 'exchange').length,
      freeDonations: books.filter(b => b.mode === 'donate').length
    };
  }

  /* WISHLIST */
  async toggleWishlist(bookId) {
    await this.init();
    let list = JSON.parse(localStorage.getItem(STORAGE_KEY_WISHLIST) || '[]');
    const index = list.indexOf(bookId);
    let added = false;
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(bookId);
      added = true;
    }
    localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(list));
    return added;
  }

  async getWishlistIds() {
    await this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEY_WISHLIST) || '[]');
  }

  async getWishlistBooks() {
    await this.init();
    const ids = await this.getWishlistIds();
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    return books.filter(b => ids.includes(b.id));
  }

  /* MESSAGES */
  async getMessages(otherUserEmail) {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES) || '[]');
    if (!currentUser) return [];

    return allMsgs.filter(m =>
      (m.senderEmail === currentUser.email && m.receiverEmail === otherUserEmail) ||
      (m.receiverEmail === currentUser.email && m.senderEmail === otherUserEmail)
    );
  }

  async sendMessage(receiverEmail, text, bookTitle = '') {
    await this.init();
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('Must be logged in to send messages');

    const allMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES) || '[]');
    const newMsg = {
      id: 'msg-' + Date.now(),
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      receiverEmail: receiverEmail,
      text: text,
      bookTitle: bookTitle,
      timestamp: new Date().toISOString()
    };

    allMsgs.push(newMsg);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(allMsgs));
    return newMsg;
  }

  /* REVIEWS */
  async addReview(sellerEmail, rating, comment) {
    await this.init();
    const currentUser = await this.getCurrentUser();
    const reviews = JSON.parse(localStorage.getItem(STORAGE_KEY_REVIEWS) || '[]');

    const newReview = {
      id: 'rev-' + Date.now(),
      sellerEmail: sellerEmail,
      reviewerName: currentUser?.name || 'Anonymous Student',
      rating: parseInt(rating),
      comment: comment,
      date: new Date().toISOString()
    };

    reviews.unshift(newReview);
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    return newReview;
  }

  async getSellerReviews(sellerEmail) {
    await this.init();
    const reviews = JSON.parse(localStorage.getItem(STORAGE_KEY_REVIEWS) || '[]');
    return reviews.filter(r => r.sellerEmail === sellerEmail);
  }

  /* AI RECOMMENDATIONS */
  async getAIRecommendations(branch = 'CE', semester = 5) {
    await this.init();
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    return books.map(b => {
      let score = 0;
      if (b.branch === branch || b.branch === 'All') score += 40;
      if (b.semester === parseInt(semester)) score += 50;
      if (b.resourceType === 'lab_manual') score += 10;
      return { ...b, aiScore: score };
    }).sort((a, b) => b.aiScore - a.aiScore).slice(0, 4);
  }

  /* BOOKS CRUD */
  async getBooks(filters = {}) {
    await this.init();
    let books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    const { query, mode, genre, semester, branch, resourceType, condition, sort, category, subject, edition, maxPrice } = filters;

    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      books = books.filter(b =>
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.genre || '').toLowerCase().includes(q) ||
        (b.subject || '').toLowerCase().includes(q) ||
        (b.gtuCode || '').toLowerCase().includes(q) ||
        (b.isbn || '').toLowerCase().includes(q)
      );
    }

    if (category && category.toLowerCase() !== 'all') books = books.filter(b => (b.category || 'physical').toLowerCase() === category.toLowerCase());
    if (mode && mode.toLowerCase() !== 'all') books = books.filter(b => b.mode.toLowerCase() === mode.toLowerCase());
    if (genre && genre.toLowerCase() !== 'all') books = books.filter(b => b.genre.toLowerCase() === genre.toLowerCase() || (b.branch && b.branch.toLowerCase() === genre.toLowerCase()));
    if (subject && subject.toLowerCase() !== 'all subjects' && subject.toLowerCase() !== 'all') books = books.filter(b => (b.subject || b.genre || '').toLowerCase() === subject.toLowerCase());
    if (edition && edition.toLowerCase() !== 'any edition' && edition.toLowerCase() !== 'all') books = books.filter(b => (b.edition || '').toLowerCase() === edition.toLowerCase());
    if (semester && semester.toLowerCase() !== 'all') books = books.filter(b => b.semester && b.semester.toString() === semester.toString());
    if (branch && branch.toLowerCase() !== 'all') books = books.filter(b => b.branch === 'All' || (b.branch && b.branch.toLowerCase() === branch.toLowerCase()));
    if (resourceType && resourceType.toLowerCase() !== 'all') books = books.filter(b => b.resourceType === resourceType);
    if (condition && condition.toLowerCase() !== 'any condition' && condition.toLowerCase() !== 'all') books = books.filter(b => (b.condition || '').toLowerCase() === condition.toLowerCase());
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') books = books.filter(b => (b.price || 0) <= parseFloat(maxPrice));

    if (sort === 'price-low') books.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') books.sort((a, b) => b.price - a.price);
    if (sort === 'rating') books.sort((a, b) => (b.rating || 5.0) - (a.rating || 5.0));
    if (sort === 'semester') books.sort((a, b) => a.semester - b.semester);

    return books;
  }

  async getBookById(id) {
    await this.init();
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    return books.find(b => b.id === id) || null;
  }

  async addBook(bookData) {
    await this.init();
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    const currentUser = await this.getCurrentUser();

    const resType = bookData.resourceType || 'textbook';
    let icon = '📖';
    if (resType === 'lab_manual') icon = '📋';
    if (resType === 'question_bank') icon = '📑';
    if (resType === 'project_report') icon = '📂';

    const gradients = [
      'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      'linear-gradient(135deg, #059669 0%, #047857 100%)',
      'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
    ];

    const newBook = {
      id: 'rcti-' + Date.now(),
      category: bookData.category || 'physical',
      title: bookData.title.toUpperCase(),
      author: bookData.author.toUpperCase(),
      isbn: bookData.isbn || 'GTU-N/A',
      gtuCode: bookData.gtuCode || '',
      resourceType: resType,
      genre: bookData.genre || 'Computer Engineering',
      subject: bookData.subject || bookData.title,
      semester: parseInt(bookData.semester || 5),
      branch: bookData.branch || 'CE',
      edition: bookData.edition || 'GTU Edition',
      publisher: bookData.publisher || 'Atul Prakashan',
      language: bookData.language || 'English',
      mode: bookData.mode || 'exchange',
      price: bookData.mode === 'sell' ? (parseFloat(bookData.price) || 0) : 0,
      exchangeFor: bookData.mode === 'exchange' ? bookData.exchangeFor : '',
      condition: bookData.condition || 'Good',
      description: bookData.description || 'GTU diploma resource listed on BookBridge.',
      pdfUrl: bookData.pdfUrl || '',
      contactPreference: bookData.contactPreference || 'Both',
      seller: {
        id: currentUser?.id || 'usr-guest',
        name: currentUser?.name || bookData.sellerName || 'RCTI Student',
        role: currentUser?.role || 'student',
        rating: 5.0,
        email: currentUser?.email || bookData.sellerEmail || 'student@rcti.ac.in',
        whatsapp: bookData.sellerWhatsapp || currentUser?.whatsapp || '+919876543210'
      },
      location: bookData.location || 'RCTI Campus, Ahmedabad',
      coverGradient: gradients[Math.floor(Math.random() * gradients.length)],
      textColor: '#ffffff',
      icon: icon,
      status: 'Available',
      viewsCount: 1,
      wishlistCount: 0,
      createdAt: new Date().toISOString()
    };

    books.unshift(newBook);
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
    return newBook;
  }

  async updateBook(bookId, updatedFields) {
    await this.init();
    const books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    const index = books.findIndex(b => b.id === bookId);
    if (index >= 0) {
      books[index] = { ...books[index], ...updatedFields };
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
      return books[index];
    }
    return null;
  }

  async updateBookStatus(bookId, newStatus) {
    await this.init();
    return await this.updateBook(bookId, { status: newStatus });
  }

  async deleteBook(bookId) {
    await this.init();
    let books = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKS) || '[]');
    books = books.filter(b => b.id !== bookId);
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  }

  async buyBook(bookId, buyerInfo) {
    await this.init();
    await this.updateBookStatus(bookId, 'Sold');
  }

  async proposeExchange(offerData) {
    await this.init();
    const offers = JSON.parse(localStorage.getItem(STORAGE_KEY_OFFERS) || '[]');
    offers.unshift(offerData);
    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(offers));
  }

  async claimDonation(bookId, claimantInfo) {
    await this.init();
    await this.updateBookStatus(bookId, 'Sold');
  }
}

window.BookDB = new OfficialRCTIDatabase();
