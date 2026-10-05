const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const { sequelize, User, MenuItem } = require('../src/models');
const bcrypt = require('bcryptjs');

let server;
let baseUrl;

describe('Authentication & Authorization Suite', () => {
  before(async () => {
    await sequelize.authenticate();

    // Ensure test fixture users exist with test credentials
    const testPassword = await bcrypt.hash('Password123!', 10);
    const [alice] = await User.findOrCreate({
      where: { email: 'alice@example.com' },
      defaults: { name: 'Alice Johnson', role: 'customer', password: testPassword },
    });
    await alice.update({ password: testPassword });

    const [bob] = await User.findOrCreate({
      where: { email: 'bob@example.com' },
      defaults: { name: 'Bob Smith', role: 'customer', password: testPassword },
    });
    await bob.update({ password: testPassword });

    const [sarah] = await User.findOrCreate({
      where: { email: 'sarah@restaurant.com' },
      defaults: { name: 'Sarah Connor', role: 'admin', password: testPassword },
    });
    await sarah.update({ role: 'admin', password: testPassword });

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // 1. SIGNUP TESTS
  describe('POST /api/auth/signup', () => {
    test('successfully signs up a new customer and returns token and user without password', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Customer',
          email: uniqueEmail,
          password: 'Password123!',
          phone: '+1 (555) 999-8888',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 201);
      assert.equal(body.success, true);
      assert.ok(body.data.token, 'Token should be returned');
      assert.equal(body.data.user.email, uniqueEmail);
      assert.equal(body.data.user.role, 'customer');
      assert.equal(body.data.user.password, undefined, 'Password must not be returned');
    });

    test('ignores client-supplied staff and admin roles', async () => {
      for (const signupPath of ['/api/auth/signup', '/api/users/signup']) {
        for (const suppliedRole of ['staff', 'admin']) {
          const email = `public_${suppliedRole}_${Date.now()}_${Math.random()}@example.com`;
          const res = await fetch(`${baseUrl}${signupPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Attempted ${suppliedRole}`,
              email,
              password: 'Password123!',
              role: suppliedRole,
            }),
          });

          const body = await res.json();
          assert.equal(res.status, 201);
          assert.equal(body.data.user.role, 'customer');

          const savedUser = await User.findOne({ where: { email } });
          assert.equal(savedUser.role, 'customer');
        }
      }
    });

    test('does not allow public signup to activate a passwordless privileged account', async () => {
      const email = `passwordless_admin_${Date.now()}@example.com`;
      const privilegedUser = await User.create({
        name: 'Provisioned Admin',
        email,
        role: 'admin',
        password: null,
      });

      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Claimed Admin',
          email,
          password: 'Password123!',
          role: 'admin',
        }),
      });

      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal((await User.findByPk(privilegedUser.id)).role, 'admin');
    });

    test('rejects login and authenticated requests for restricted users (403)', async () => {
      const restrictedEmail = `restricted_${Date.now()}@example.com`;
      const testPassword = await bcrypt.hash('Password123!', 10);
      const restrictedUser = await User.create({
        name: 'Restricted User',
        email: restrictedEmail,
        password: testPassword,
        role: 'customer',
        isRestricted: true,
      });

      // Login attempt
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: restrictedEmail,
          password: 'Password123!',
        }),
      });

      assert.equal(loginRes.status, 403);
      const loginBody = await loginRes.json();
      assert.equal(loginBody.isRestricted, true);
    });

    test('rejects signup with invalid email format', async () => {
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bad Email',
          email: 'not-an-email',
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.ok(body.details.some((d) => d.field === 'email'));
    });

    test('rejects signup with short password (< 6 characters)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short Pwd',
          email: `shortpwd_${Date.now()}@example.com`,
          password: '123',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.ok(body.details.some((d) => d.field === 'password'));
    });

    test('rejects duplicate email with 409 Conflict', async () => {
      const email = `dupe_${Date.now()}@example.com`;
      // First signup
      await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'First User',
          email,
          password: 'Password123!',
        }),
      });

      // Second signup with same email
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Second User',
          email,
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 409);
      assert.equal(body.success, false);
      assert.equal(body.error, 'Email already exists');
    });
  });

  // 2. LOGIN TESTS
  describe('POST /api/auth/login', () => {
    test('successfully logs in with valid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alice@example.com',
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.ok(body.data.token, 'Token should be returned');
      assert.equal(body.data.user.email, 'alice@example.com');
      assert.equal(body.data.user.password, undefined);
    });

    test('rejects incorrect password with generic error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alice@example.com',
          password: 'WrongPassword!',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 401);
      assert.equal(body.success, false);
      assert.equal(body.error, 'Invalid email or password');
    });

    test('rejects non-existent email with generic error', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 401);
      assert.equal(body.success, false);
      assert.equal(body.error, 'Invalid email or password');
    });

    test('safely rejects legacy user without password without crashing or silent login', async () => {
      // Create user with null password
      const noPwdEmail = `nopwd_${Date.now()}@example.com`;
      await User.create({
        name: 'No Password User',
        email: noPwdEmail,
        role: 'customer',
        password: null,
      });

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: noPwdEmail,
          password: 'AnyPassword!',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 401);
      assert.equal(body.error, 'Invalid email or password');
    });
  });

  // 3. TOKEN VALIDATION & HEADER AUTHENTICATION
  describe('Token authentication & header enforcement', () => {
    test('rejects protected request without Authorization header', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
    });

    test('rejects insecure x-user-id header without valid Bearer token', async () => {
      // Alice is user #1
      const res = await fetch(`${baseUrl}/api/orders`, {
        headers: {
          'x-user-id': '1',
        },
      });

      assert.equal(res.status, 401, 'x-user-id must no longer be accepted as authentication');
    });

    test('rejects invalid or tampered JWT token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid.token.value',
        },
      });

      assert.equal(res.status, 401);
    });

    test('accepts valid JWT token on GET /api/auth/me', async () => {
      // Login as Alice
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alice@example.com',
          password: 'Password123!',
        }),
      });
      const { data } = await loginRes.json();

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      assert.equal(meRes.status, 200);
      const meBody = await meRes.json();
      assert.equal(meBody.data.email, 'alice@example.com');
      assert.equal(meBody.data.password, undefined);
    });
  });

  // 4. ORDER OWNERSHIP & USER ISOLATION
  describe('Order ownership & user isolation', () => {
    let aliceToken;
    let bobToken;
    let adminToken;
    let aliceUser;
    let bobUser;
    let testMenuItem;

    before(async () => {
      // Alice
      const aRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' }),
      });
      const aData = await aRes.json();
      aliceToken = aData.data.token;
      aliceUser = aData.data.user;

      // Bob
      const bRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bob@example.com', password: 'Password123!' }),
      });
      const bData = await bRes.json();
      bobToken = bData.data.token;
      bobUser = bData.data.user;

      // Sarah Admin
      const sRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sarah@restaurant.com', password: 'Password123!' }),
      });
      const sData = await sRes.json();
      adminToken = sData.data.token;

      testMenuItem = await MenuItem.findOne();
    });

    test('derives order userId from authenticated token, ignoring spoofed client userId', async () => {
      // Alice tries to create order for Bob (userId: bobUser.id)
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aliceToken}`,
        },
        body: JSON.stringify({
          userId: bobUser.id, // Attempt to assign order to Bob
          items: [{ menuItemId: testMenuItem.id, quantity: 2 }],
          notes: 'Order placed by Alice',
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      // Server must derive userId strictly from Alice's token
      assert.equal(body.data.userId, aliceUser.id, 'Order userId must be derived from token');
    });

    test('customer only sees their own orders in GET /api/orders', async () => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${aliceToken}`,
        },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.length > 0);
      for (const order of body.data) {
        assert.equal(order.userId, aliceUser.id, 'Every returned order must belong to Alice');
      }
    });

    test('customer cannot inspect another customer order by ID (403 Forbidden)', async () => {
      // Bob's orders
      const bobOrdersRes = await fetch(`${baseUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${bobToken}` },
      });
      const bobOrders = await bobOrdersRes.json();
      const bobOrderId = bobOrders.data[0].id;

      // Alice tries to inspect Bob's order
      const res = await fetch(`${baseUrl}/api/orders/${bobOrderId}`, {
        headers: {
          Authorization: `Bearer ${aliceToken}`,
        },
      });

      assert.equal(res.status, 403, 'Customer cannot view another user order');
    });

    test('admin can view all orders and filter by user', async () => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      // Admin sees orders from multiple users
      const userIds = new Set(body.data.map((o) => o.userId));
      assert.ok(userIds.size >= 2, 'Admin should view orders from multiple users');
    });
  });

  // 5. ROLE AUTHORIZATION & ADMIN PRIVILEGES
  describe('Role authorization & admin privileges', () => {
    let customerToken;
    let adminToken;

    before(async () => {
      const cRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' }),
      });
      customerToken = (await cRes.json()).data.token;

      const aRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sarah@restaurant.com', password: 'Password123!' }),
      });
      adminToken = (await aRes.json()).data.token;
    });

    test('customer cannot list all users (GET /api/users returns 403)', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
    });

    test('admin can list all users (GET /api/users returns 200)', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.length > 0);
    });

    test('customer cannot create category (POST /api/categories returns 403)', async () => {
      const res = await fetch(`${baseUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'Unauthorized Category' }),
      });
      assert.equal(res.status, 403);
    });
  });
});
