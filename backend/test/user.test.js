const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const userService = require('../src/services/userService');

let server;
let baseUrl;
let customerToken;
let customerUser;
let adminToken;
let otherCustomerToken;
let otherCustomerUser;

describe('User Controller & Service Test Suite', () => {
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

    // Login Alice (customer)
    const aliceRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' }),
    });
    const aliceData = await aliceRes.json();
    customerToken = aliceData.data.token;
    customerUser = aliceData.data.user;

    // Login Bob (other customer)
    const bobRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', password: 'Password123!' }),
    });
    const bobData = await bobRes.json();
    otherCustomerToken = bobData.data.token;
    otherCustomerUser = bobData.data.user;

    // Login Sarah (admin)
    const sarahRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah@restaurant.com', password: 'Password123!' }),
    });
    const sarahData = await sarahRes.json();
    adminToken = sarahData.data.token;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // 1. UNIT TESTS: userService helper functions
  describe('userService unit functions', () => {
    test('canAccessUserProfile allows admins for any user id', () => {
      assert.equal(userService.canAccessUserProfile({ id: 1, role: 'admin' }, 99), true);
    });

    test('canAccessUserProfile allows user accessing their own id', () => {
      assert.equal(userService.canAccessUserProfile({ id: 5, role: 'customer' }, '5'), true);
      assert.equal(userService.canAccessUserProfile({ id: 5, role: 'customer' }, 5), true);
    });

    test('canAccessUserProfile rejects non-admin accessing another user id', () => {
      assert.equal(userService.canAccessUserProfile({ id: 5, role: 'customer' }, 6), false);
      assert.equal(userService.canAccessUserProfile(null, 5), false);
    });

    test('sanitizeUserUpdates strips role for non-admins', () => {
      const updates = { name: 'Alice New', role: 'admin', phone: '123456789' };
      const sanitized = userService.sanitizeUserUpdates(updates, { id: 1, role: 'customer' });
      assert.equal(sanitized.role, undefined);
      assert.equal(sanitized.name, 'Alice New');
      assert.equal(sanitized.phone, '123456789');
    });

    test('sanitizeUserUpdates retains role for admins', () => {
      const updates = { name: 'Staff Person', role: 'staff' };
      const sanitized = userService.sanitizeUserUpdates(updates, { id: 2, role: 'admin' });
      assert.equal(sanitized.role, 'staff');
      assert.equal(sanitized.name, 'Staff Person');
    });

    test('sanitizeUserUpdates strips admin role even for admins', () => {
      const updates = { name: 'New Admin Attempt', role: 'admin' };
      const sanitized = userService.sanitizeUserUpdates(updates, { id: 2, role: 'admin' });
      assert.equal(sanitized.role, undefined);
      assert.equal(sanitized.name, 'New Admin Attempt');
    });

    test('hashPassword hashes non-empty string and returns null for empty', async () => {
      const hashed = await userService.hashPassword('MySecretPass');
      assert.ok(hashed);
      assert.equal(await bcrypt.compare('MySecretPass', hashed), true);

      assert.equal(await userService.hashPassword(null), null);
      assert.equal(await userService.hashPassword(''), null);
    });

    test('isEmailTaken detects existing vs non-existing emails', async () => {
      assert.equal(await userService.isEmailTaken('alice@example.com'), true);
      assert.equal(await userService.isEmailTaken(`nonexistent_${Date.now()}@example.com`), false);
    });
  });

  // 2. ENDPOINT TESTS: GET /api/users
  describe('GET /api/users', () => {
    test('rejects customer with 403', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
    });

    test('allows admin and returns all users ordered by ID ASC', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.count >= 2);

      // Verify ascending order
      for (let i = 1; i < body.data.length; i++) {
        assert.ok(body.data[i].id >= body.data[i - 1].id);
      }
    });
  });

  // 3. ENDPOINT TESTS: GET /api/users/:id
  describe('GET /api/users/:id', () => {
    test('customer can view own profile with orders array', async () => {
      const res = await fetch(`${baseUrl}/api/users/${customerUser.id}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, customerUser.id);
      assert.ok(Array.isArray(body.data.orders));
    });

    test('customer cannot view another customer profile (403)', async () => {
      const res = await fetch(`${baseUrl}/api/users/${otherCustomerUser.id}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error, 'Access denied: You can only view your own user profile');
    });

    test('admin can view any user profile', async () => {
      const res = await fetch(`${baseUrl}/api/users/${customerUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.id, customerUser.id);
    });

    test('returns 404 for non-existent user ID', async () => {
      const res = await fetch(`${baseUrl}/api/users/999999`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error, 'User with ID 999999 not found');
    });
  });

  // 4. ENDPOINT TESTS: POST /api/users
  describe('POST /api/users', () => {
    test('customer cannot create users (403)', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: 'Unauthorized Create',
          email: `unauth_${Date.now()}@example.com`,
          role: 'customer',
        }),
      });
      assert.equal(res.status, 403);
    });

    test('admin can create a user successfully', async () => {
      const newEmail = `created_${Date.now()}@example.com`;
      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Created User',
          email: newEmail,
          role: 'staff',
          phone: '+1 555-0199',
          password: 'Password123!',
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, 'User created successfully');
      assert.equal(body.data.email, newEmail);
      assert.equal(body.data.role, 'staff');
      assert.equal(body.data.password, undefined);
    });

    test('rejects duplicate email with 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Duplicate Email Test',
          email: 'alice@example.com',
          role: 'customer',
        }),
      });

      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error, 'Email already exists');
      assert.equal(body.details[0].field, 'email');
    });

    test('rejects creating admin role via POST /api/users (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Admin API Attempt',
          email: `admin_api_${Date.now()}@example.com`,
          role: 'admin',
          password: 'Password123!',
        }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.details.some((d) => d.field === 'role'));
    });
  });

  // 5. ENDPOINT TESTS: PUT /api/users/:id
  describe('PUT /api/users/:id', () => {
    test('customer can update their own profile name and phone', async () => {
      const res = await fetch(`${baseUrl}/api/users/${customerUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: 'Alice Updated',
          phone: '+1 (555) 777-6666',
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, 'User updated successfully');
      assert.equal(body.data.name, 'Alice Updated');
      assert.equal(body.data.phone, '+1 (555) 777-6666');
    });

    test('customer cannot elevate their own role to admin', async () => {
      const res = await fetch(`${baseUrl}/api/users/${customerUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          role: 'admin',
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.role, 'customer', 'Role must remain customer');

      const checkUser = await User.findByPk(customerUser.id);
      assert.equal(checkUser.role, 'customer');
    });

    test('admin cannot promote user to admin role via PUT /api/users/:id', async () => {
      const res = await fetch(`${baseUrl}/api/users/${customerUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          role: 'admin',
        }),
      });

      // Role update to admin is rejected by validation (400) or stripped from updates
      if (res.status === 400) {
        const body = await res.json();
        assert.ok(body.details.some((d) => d.field === 'role'));
      } else {
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.notEqual(body.data.role, 'admin');
      }

      const checkUser = await User.findByPk(customerUser.id);
      assert.equal(checkUser.role, 'customer', 'Database role must remain customer');
    });

    test('customer cannot update another user profile (403)', async () => {
      const res = await fetch(`${baseUrl}/api/users/${otherCustomerUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: 'Hacked Name',
        }),
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error, 'Access denied: You can only update your own user profile');
    });

    test('rejects updating to an email that is already taken (409)', async () => {
      const res = await fetch(`${baseUrl}/api/users/${customerUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          email: otherCustomerUser.email,
        }),
      });

      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.error, 'Email already exists');
    });

    test('returns 404 when updating non-existent user', async () => {
      const res = await fetch(`${baseUrl}/api/users/999999`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Nobody',
        }),
      });

      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.error, 'User with ID 999999 not found');
    });
  });

  // 6. ENDPOINT TESTS: DELETE /api/users/:id
  describe('DELETE /api/users/:id', () => {
    let userToDelete;

    before(async () => {
      userToDelete = await User.create({
        name: 'Delete Me',
        email: `deleteme_${Date.now()}@example.com`,
        role: 'customer',
      });
    });

    test('customer cannot delete user (403)', async () => {
      const res = await fetch(`${baseUrl}/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
    });

    test('admin receives 404 when deleting non-existent user', async () => {
      const res = await fetch(`${baseUrl}/api/users/999999`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.error, 'User with ID 999999 not found');
    });

    test('admin can delete user successfully', async () => {
      const res = await fetch(`${baseUrl}/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, `User with ID ${userToDelete.id} deleted successfully`);

      const inDb = await User.findByPk(userToDelete.id);
      assert.equal(inDb, null);
    });
  });
});
