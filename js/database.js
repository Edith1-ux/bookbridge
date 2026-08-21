/**
 * ==========================================================================
 * BOOKBRIDGE CLIENT ADAPTER
 * Proxies legacy database interface directly to Django REST Framework API
 * No local persistence of users, passwords, listings, or transactions
 * ==========================================================================
 */

class BookBridgeAPIAdapter {
  constructor() {
    this.api = window.BookAPI;
  }

  async getBooks(filters = {}) {
    return (window.BookAPI || this.api).getBooks(filters);
  }

  async getBookById(id) {
    return (window.BookAPI || this.api).getBookById(id);
  }

  async addBook(bookData) {
    return (window.BookAPI || this.api).addBook(bookData);
  }

  async deleteBook(id) {
    return (window.BookAPI || this.api).deleteBook(id);
  }

  async getCurrentUser() {
    return (window.BookAPI || this.api).getCurrentUser();
  }

  async login(email, password) {
    return (window.BookAPI || this.api).login(email, password);
  }

  async register(userData) {
    return (window.BookAPI || this.api).register(userData);
  }

  async logout() {
    return (window.BookAPI || this.api).logout();
  }

  async getWishlist() {
    return (window.BookAPI || this.api).getWishlistBooks();
  }

  async toggleWishlist(bookId) {
    return (window.BookAPI || this.api).toggleWishlist(bookId);
  }

  async getStatistics() {
    return (window.BookAPI || this.api).getAdminStats();
  }
}

window.BookDB = new BookBridgeAPIAdapter();
