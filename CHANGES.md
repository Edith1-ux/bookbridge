# BookBridge – fixes in this zip

## Login
- js/api.js: finds the Django server automatically when the page is opened from
  VS Code Live Server / another port / file:// (was always "/api" -> login failed there)
- js/api.js: clear error messages (server not running, wrong address)
- backend/config/settings/base.py: 20 login tries/minute (was 10), Live Server allowed by CORS in local dev
- browse-1.html renamed to browse.html (the server looks for browse.html -> "Buy Books" was a 404)
- backend/apps/users/test_login_flow.py: new login tests

## Messages
- backend/apps/chat/*, js/app.js, js/api.js, style.css, css/style.css (chat screen, conversations, reply box)

## Demo accounts (after `python backend/manage.py seed_db`)
- Student: student@rcti.ac.in / Student@123
- Admin:   admin@bookbridge.edu / Admin@123456

## Buyer <-> seller chat (Contact Seller)
- Bug fixed: listings never include the seller's email, so "Contact Seller" and the campus-purchase message were sent to
  seller@bookbridge.local and never reached the seller. Messages now go by seller id (`receiver_id`).
- backend/apps/chat/serializers.py: accepts `receiver_id` (or `receiver_email`); cannot message yourself
- js/api.js: `sendMessageToUser(id, text, bookTitle)`
- js/app.js: "Contact Seller" opens a message box (no more browser prompt), then opens the chat;
  campus purchase opens the chat too; dashboard.html?tab=messages&with=<email> opens that conversation
- style.css: message box styles
- backend/apps/chat/tests.py: new buyer -> seller -> reply tests

## "messages.map is not a function" on the dashboard
- The error comes from the OLD js/app.js still running on the phone/site. The new code accepts every response shape
  (array, {results}, {messages}), so it cannot happen any more.
- sw.js: cache bumped to v2.2 and changed from cache-first to network-first, so phones get the new app.js right
  after a deploy instead of the stale cached copy.
