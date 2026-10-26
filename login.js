/* ==========================================================
                    BOOK BRIDGE LOGIN JS (Legacy)
   NOTE: This file is kept for backward compatibility.
   The actual login logic is now handled by js/app.js
   via initLoginPage() which calls window.BookAPI.login()
   — a real authenticated API call to /api/login on the backend.
========================================================== */

/**
 * This file is intentionally minimal now.
 * All login logic including:
 * - Real API call to /api/login
 * - Proper error handling
 * - JWT token storage
 * - Redirect after login
 * ... is handled by js/app.js → initLoginPage()
 *
 * This file only handles the old-style password toggle
 * that was already moved to login.html inline script.
 */

console.log('[login.js] Legacy file loaded. Active login logic is in js/app.js');