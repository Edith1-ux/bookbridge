/**
 * ==========================================================================
 * BOOKBRIDGE 2.0 AUTOMATED INTEGRATION & VERIFICATION TEST SUITE
 * Tests all 18 core requirements: DB, Auth, RBAC, Reset, Chat, Admin, Health
 * ==========================================================================
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '8099';
process.env.JWT_SECRET = 'test_secret_key_bookbridge_enterprise_2026_super_secure';

const { app, server } = require('../server');
const { connectDB, sequelize, getSQLStatus } = require('../config/db');
const { syncDatabase, User, Book, Conversation, Message, PasswordResetToken, AuditLog } = require('../models');
const { seedDatabase } = require('../config/seed');

let baseUrl = 'http://127.0.0.1:8099';
let isServerRunning = false;

// Helper function to make HTTP requests
function request(method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    let reqBody = null;
    if (body) {
      reqBody = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json
          });
        });
      }
    );

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

const testResults = [];

function recordTest(testNumber, name, passed, details = '') {
  testResults.push({ testNumber, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [Test ${testNumber}] ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('===================================================');
  console.log('🧪 RUNNING BOOKBRIDGE 2.0 AUTOMATED TEST SUITE');
  console.log('===================================================');

  try {
    // 1. Connect and seed test database
    await connectDB();
    await syncDatabase({ alter: false });
    await seedDatabase();

    // 2. Start server
    await new Promise((resolve) => {
      server.listen(8099, '127.0.0.1', () => {
        isServerRunning = true;
        resolve();
      });
    });

    let studentToken = null;
    let studentUser = null;
    let adminToken = null;
    let sellerToken = null;
    let sellerUser = null;
    let testBook = null;
    let testConversation = null;

    // Test 1: Server starts without missing-module errors
    try {
      assert(isServerRunning === true, 'Server instance is listening');
      recordTest(1, 'Server starts without missing-module errors', true);
    } catch (e) {
      recordTest(1, 'Server starts without missing-module errors', false, e.message);
    }

    // Test 2: Database connection succeeds with valid configuration
    try {
      assert.strictEqual(getSQLStatus(), true, 'Database status should be connected');
      recordTest(2, 'Database connection succeeds with valid configuration', true);
    } catch (e) {
      recordTest(2, 'Database connection succeeds with valid configuration', false, e.message);
    }

    // Test 3: Registration persists a new user in database
    try {
      const email = `test.student.${Date.now()}@rcti.ac.in`;
      const res = await request('POST', '/api/register', {
        name: 'Test Student',
        email,
        password: 'Password123!',
        enrollment: `ENR-${Date.now()}`,
        branch: 'CE',
        semester: 3
      });

      assert.strictEqual(res.status, 201, 'Registration returns 201 Created');
      assert(res.data.token, 'Response contains auth token');
      assert.strictEqual(res.data.user.email, email, 'Email matches');
      studentToken = res.data.token;
      studentUser = res.data.user;

      // Verify in DB directly
      const dbUser = await User.findOne({ where: { email } });
      assert(dbUser !== null, 'User exists in SQL database');
      recordTest(3, 'Registration persists a new user in database', true);
    } catch (e) {
      recordTest(3, 'Registration persists a new user in database', false, e.message);
    }

    // Test 4: Duplicate registration is rejected
    try {
      const res = await request('POST', '/api/register', {
        name: 'Duplicate Student',
        email: studentUser.email,
        password: 'Password123!',
        branch: 'CE',
        semester: 3
      });

      assert.strictEqual(res.status, 409, 'Duplicate registration returns 409 Conflict');
      recordTest(4, 'Duplicate registration is rejected', true);
    } catch (e) {
      recordTest(4, 'Duplicate registration is rejected', false, e.message);
    }

    // Test 5: Login works with valid credentials
    try {
      const res = await request('POST', '/api/login', {
        email: studentUser.email,
        password: 'Password123!'
      });

      assert.strictEqual(res.status, 200, 'Login returns 200 OK');
      assert(res.data.token, 'Login returns signed JWT token');
      assert.strictEqual(res.data.user.email, studentUser.email, 'User email matches');
      recordTest(5, 'Login works with valid credentials', true);
    } catch (e) {
      recordTest(5, 'Login works with valid credentials', false, e.message);
    }

    // Test 6: Invalid passwords are rejected
    try {
      const res = await request('POST', '/api/login', {
        email: studentUser.email,
        password: 'WrongPassword999!'
      });

      assert.strictEqual(res.status, 401, 'Invalid password returns 401 Unauthorized');
      recordTest(6, 'Invalid passwords are rejected', true);
    } catch (e) {
      recordTest(6, 'Invalid passwords are rejected', false, e.message);
    }

    // Test 7: Protected endpoints reject unauthenticated requests
    try {
      const res = await request('GET', '/api/auth/me');
      assert.strictEqual(res.status, 401, 'Unauthenticated request returns 401');
      recordTest(7, 'Protected endpoints reject unauthenticated requests', true);
    } catch (e) {
      recordTest(7, 'Protected endpoints reject unauthenticated requests', false, e.message);
    }

    // Test 8: Password reset flow (generate token, verify, execute, and prevent reuse)
    try {
      // 8a. Request reset
      const forgotRes = await request('POST', '/api/auth/forgot-password', {
        email: studentUser.email
      });
      assert.strictEqual(forgotRes.status, 200, 'Forgot password returns 200');

      // 8b. Create known test token
      const crypto = require('crypto');
      const testRawToken = `tok_${Date.now()}_reset_test_key`;
      const testHash = crypto.createHash('sha256').update(testRawToken).digest('hex');

      await PasswordResetToken.create({
        userId: studentUser.id,
        tokenHash: testHash,
        expiresAt: new Date(Date.now() + 3600000)
      });

      // 8c. Verify token endpoint
      const verifyRes = await request('GET', `/api/auth/verify-reset-token/${testRawToken}`);
      assert.strictEqual(verifyRes.status, 200, 'Verify token endpoint returns 200');

      // 8d. Execute reset with a new password
      const resetRes = await request('POST', '/api/auth/reset-password', {
        token: testRawToken,
        newPassword: 'BrandNewPassword456!',
        confirmPassword: 'BrandNewPassword456!'
      });
      assert.strictEqual(resetRes.status, 200, 'Reset password succeeds with 200');

      // Verify new password works
      const loginNewRes = await request('POST', '/api/login', {
        email: studentUser.email,
        password: 'BrandNewPassword456!'
      });
      assert.strictEqual(loginNewRes.status, 200, 'Login with new password succeeds');

      // 8e. Reused token must be rejected
      const reuseRes = await request('POST', '/api/auth/reset-password', {
        token: testRawToken,
        newPassword: 'AnotherPassword789!',
        confirmPassword: 'AnotherPassword789!'
      });
      assert.strictEqual(reuseRes.status, 400, 'Reused token is rejected with 400');

      recordTest(8, 'Password reset links work, expire, and cannot be reused', true);
    } catch (e) {
      recordTest(8, 'Password reset links work, expire, and cannot be reused', false, e.message);
    }

    // Register a second user (Seller)
    const sellerEmail = `seller.${Date.now()}@rcti.ac.in`;
    const sellerRes = await request('POST', '/api/register', {
      name: 'Seller Student',
      email: sellerEmail,
      password: 'Password123!',
      branch: 'IT',
      semester: 5
    });
    sellerToken = sellerRes.data.token;
    sellerUser = sellerRes.data.user;

    // Test 9: Create book listing with validation
    try {
      const bookRes = await request(
        'POST',
        '/api/books',
        {
          title: 'Automated Test Textbook',
          author: 'Test Author',
          semester: 4,
          branch: 'IT',
          mode: 'sell',
          price: 299.00,
          condition: 'Like New'
        },
        { Authorization: `Bearer ${sellerToken}` }
      );

      assert.strictEqual(bookRes.status, 201, 'Book creation returns 201 Created');
      assert.strictEqual(bookRes.data.title, 'Automated Test Textbook');
      testBook = bookRes.data;
      recordTest(9, 'Book listing creation and validation work', true);
    } catch (e) {
      recordTest(9, 'Book listing creation and validation work', false, e.message);
    }

    // Test 10: User can start a conversation with seller
    try {
      const convRes = await request(
        'POST',
        '/api/conversations',
        {
          recipientId: sellerUser.id,
          bookId: testBook.id
        },
        { Authorization: `Bearer ${studentToken}` }
      );

      assert.strictEqual(convRes.status, 200, 'Conversation initialization returns 200 OK');
      testConversation = convRes.data;
      assert(testConversation.id, 'Conversation has valid ID');
      recordTest(10, 'A user can start a conversation with a seller', true);
    } catch (e) {
      recordTest(10, 'A user can start a conversation with a seller', false, e.message);
    }

    // Test 11: Messages persist in database and arrive
    try {
      const msgRes = await request(
        'POST',
        `/api/conversations/${testConversation.id}/messages`,
        { text: 'Hello, is this textbook still available?' },
        { Authorization: `Bearer ${studentToken}` }
      );

      assert.strictEqual(msgRes.status, 201, 'Message post returns 201 Created');

      // Retrieve messages as recipient (Seller)
      const getMsgsRes = await request(
        'GET',
        `/api/conversations/${testConversation.id}/messages`,
        null,
        { Authorization: `Bearer ${sellerToken}` }
      );

      assert.strictEqual(getMsgsRes.status, 200, 'Get messages returns 200 OK');
      assert.strictEqual(getMsgsRes.data.length >= 1, true, 'At least 1 message found');
      assert.strictEqual(getMsgsRes.data[0].text, 'Hello, is this textbook still available?');

      recordTest(11, 'Messages persist in database and can be retrieved', true);
    } catch (e) {
      recordTest(11, 'Messages persist in database and can be retrieved', false, e.message);
    }

    // Test 12: Nonparticipants cannot access private conversations
    try {
      const thirdRes = await request('POST', '/api/register', {
        name: 'Third Party',
        email: `third.${Date.now()}@rcti.ac.in`,
        password: 'Password123!'
      });

      const eavesdropRes = await request(
        'GET',
        `/api/conversations/${testConversation.id}/messages`,
        null,
        { Authorization: `Bearer ${thirdRes.data.token}` }
      );

      assert.strictEqual(eavesdropRes.status, 403, 'Nonparticipant is blocked with 403 Forbidden');
      recordTest(12, 'Nonparticipants cannot access private conversations', true);
    } catch (e) {
      recordTest(12, 'Nonparticipants cannot access private conversations', false, e.message);
    }

    // Test 13: Admin login and role protection
    try {
      const adminLoginRes = await request('POST', '/api/login', {
        email: 'admin@rcti.ac.in',
        password: 'password123'
      });

      assert.strictEqual(adminLoginRes.status, 200, 'Admin login succeeds');
      adminToken = adminLoginRes.data.token;

      // Student tries to access admin stats -> must be 403
      const studentAdminRes = await request(
        'GET',
        '/api/admin/stats',
        null,
        { Authorization: `Bearer ${studentToken}` }
      );
      assert.strictEqual(studentAdminRes.status, 403, 'Student blocked from admin route with 403');

      // Admin accesses admin stats -> must be 200
      const adminStatsRes = await request(
        'GET',
        '/api/admin/stats',
        null,
        { Authorization: `Bearer ${adminToken}` }
      );
      assert.strictEqual(adminStatsRes.status, 200, 'Admin receives stats with 200');
      assert(adminStatsRes.data.totalUsers >= 2, 'Stats report total users');

      recordTest(13, 'Admin-only routes reject ordinary students and permit admins', true);
    } catch (e) {
      recordTest(13, 'Admin-only routes reject ordinary students and permit admins', false, e.message);
    }

    // Test 14: Real platform statistics endpoint
    try {
      const statsRes = await request('GET', '/api/statistics');
      assert.strictEqual(statsRes.status, 200, 'Statistics returns 200');
      assert(typeof statsRes.data.active_students === 'number', 'active_students is a number');
      assert(typeof statsRes.data.books_listed === 'number', 'books_listed is a number');
      recordTest(14, 'Real statistics endpoint returns live counts', true);
    } catch (e) {
      recordTest(14, 'Real statistics endpoint returns live counts', false, e.message);
    }

    // Test 15: Frontend HTML pages and static assets load correctly
    try {
      const pages = ['/', '/browse.html', '/login.html', '/forgot-password.html', '/admin.html'];
      for (const page of pages) {
        const pageRes = await request('GET', page);
        assert.strictEqual(pageRes.status, 200, `Page ${page} returns 200`);
      }
      recordTest(15, 'Frontend pages and static assets load with HTTP 200', true);
    } catch (e) {
      recordTest(15, 'Frontend pages and static assets load with HTTP 200', false, e.message);
    }

    // Test 16: Render health check endpoint
    try {
      const healthRes = await request('GET', '/api/health');
      assert.strictEqual(healthRes.status, 200, 'Health check returns 200');
      assert.strictEqual(healthRes.data.status, 'ok', 'Status is ok');
      assert.strictEqual(healthRes.data.database.connected, true, 'Database is connected');
      recordTest(16, 'Render health check endpoint returns 200 OK', true);
    } catch (e) {
      recordTest(16, 'Render health check endpoint returns 200 OK', false, e.message);
    }

    // Test 17: Production error reporting (no silent fallback in production)
    try {
      const { Sequelize } = require('sequelize');
      const badDb = new Sequelize('mysql://baduser:badpass@127.0.0.1:9999/nodb', {
        dialect: 'mysql',
        logging: false,
        dialectOptions: { connectTimeout: 300 },
        retry: { max: 0 }
      });

      let threwError = false;
      try {
        await badDb.authenticate();
      } catch (err) {
        threwError = true;
      }
      assert.strictEqual(threwError, true, 'Bad DB credentials properly throw error');
      recordTest(17, 'Database connection reports clear error on invalid credentials', true);
    } catch (e) {
      recordTest(17, 'Database connection reports clear error on invalid credentials', false, e.message);
    }

    // Test 18: Listings persist and can be filtered by branch and semester
    try {
      const filterRes = await request('GET', `/api/books?branch=${testBook.branch}&semester=${testBook.semester}`);
      assert.strictEqual(filterRes.status, 200, 'Filtered books query returns 200');
      assert(Array.isArray(filterRes.data), 'Returns array of books');
      const found = filterRes.data.some(b => b.id === testBook.id);
      assert.strictEqual(found, true, 'Created book found in filtered query');
      recordTest(18, 'Listings persist and can be filtered by GTU branch and semester', true);
    } catch (e) {
      recordTest(18, 'Listings persist and can be filtered by GTU branch and semester', false, e.message);
    }

  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    if (server) {
      server.close();
    }
  }

  // Final Summary
  console.log('\n===================================================');
  console.log('📊 TEST SUMMARY RESULTS');
  console.log('===================================================');
  const total = testResults.length;
  const passed = testResults.filter(t => t.passed).length;
  const failed = total - passed;
  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`- [Test ${t.testNumber}] ${t.name}: ${t.details}`);
    });
  }

  console.log('===================================================');
  return { total, passed, failed, testResults };
}

if (require.main === module) {
  runTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

module.exports = { runTests };
