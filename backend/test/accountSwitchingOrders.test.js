const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { sequelize, User, Category, MenuItem, Order, OrderItem } = require('../src/models');

let server;
let baseUrl;
let aliceToken;
let bobToken;
let adminToken;
let aliceUser;
let bobUser;
let adminUser;
let testCategory;
let testDish1;
let testDish2;
let aliceOrderId;
let bobOrderId;

describe('Account Switching & Backend Order Ownership Tests', () => {
  before(async () => {
    await sequelize.authenticate();

    const testPassword = await bcrypt.hash('Password123!', 10);

    // Create Customer Alice
    [aliceUser] = await User.findOrCreate({
      where: { email: 'switch_alice@example.com' },
      defaults: { name: 'Alice Switch', role: 'customer', password: testPassword },
    });
    await aliceUser.update({ password: testPassword, role: 'customer' });

    // Create Customer Bob
    [bobUser] = await User.findOrCreate({
      where: { email: 'switch_bob@example.com' },
      defaults: { name: 'Bob Switch', role: 'customer', password: testPassword },
    });
    await bobUser.update({ password: testPassword, role: 'customer' });

    // Create Admin Sarah
    [adminUser] = await User.findOrCreate({
      where: { email: 'switch_sarah@restaurant.com' },
      defaults: { name: 'Sarah Admin', role: 'admin', password: testPassword },
    });
    await adminUser.update({ password: testPassword, role: 'admin' });

    // Setup HTTP server
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Login Alice
    const aliceRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'switch_alice@example.com', password: 'Password123!' }),
    });
    aliceToken = (await aliceRes.json()).data.token;

    // Login Bob
    const bobRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'switch_bob@example.com', password: 'Password123!' }),
    });
    bobToken = (await bobRes.json()).data.token;

    // Login Admin
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'switch_sarah@restaurant.com', password: 'Password123!' }),
    });
    adminToken = (await adminRes.json()).data.token;

    // Create Category and Menu Items
    testCategory = await Category.create({
      name: `Switch Test Cat ${Date.now()}`,
    });

    testDish1 = await MenuItem.create({
      name: `Switch Burger ${Date.now()}`,
      price: 12.50,
      categoryId: testCategory.id,
      isAvailable: true,
    });

    testDish2 = await MenuItem.create({
      name: `Switch Pizza ${Date.now()}`,
      price: 18.00,
      categoryId: testCategory.id,
      isAvailable: true,
    });

    // Alice creates an order
    const aliceOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        notes: 'Alice special order',
        items: [{ menuItemId: testDish1.id, quantity: 2 }],
      }),
    });
    const aliceOrderData = await aliceOrderRes.json();
    aliceOrderId = aliceOrderData.data.id;

    // Bob creates an order
    const bobOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bobToken}`,
      },
      body: JSON.stringify({
        notes: 'Bob special order',
        items: [{ menuItemId: testDish2.id, quantity: 1 }],
      }),
    });
    const bobOrderData = await bobOrderRes.json();
    bobOrderId = bobOrderData.data.id;
  });

  after(async () => {
    if (aliceOrderId) {
      await OrderItem.destroy({ where: { orderId: aliceOrderId } });
      await Order.destroy({ where: { id: aliceOrderId } });
    }
    if (bobOrderId) {
      await OrderItem.destroy({ where: { orderId: bobOrderId } });
      await Order.destroy({ where: { id: bobOrderId } });
    }
    if (testDish1) await MenuItem.destroy({ where: { id: testDish1.id } });
    if (testDish2) await MenuItem.destroy({ where: { id: testDish2.id } });
    if (testCategory) await Category.destroy({ where: { id: testCategory.id } });
    if (aliceUser) await User.destroy({ where: { id: aliceUser.id } });
    if (bobUser) await User.destroy({ where: { id: bobUser.id } });
    if (adminUser) await User.destroy({ where: { id: adminUser.id } });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Customer Alice only sees her own orders, not Bob orders', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const orderIds = body.data.map((o) => o.id);
    assert.ok(orderIds.includes(aliceOrderId), 'Alice should see her own order');
    assert.ok(!orderIds.includes(bobOrderId), 'Alice must NOT see Bob order');

    // All orders returned must belong to Alice
    body.data.forEach((o) => {
      assert.strictEqual(o.userId, aliceUser.id);
    });
  });

  test('Customer Bob only sees his own orders, not Alice orders', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const orderIds = body.data.map((o) => o.id);
    assert.ok(orderIds.includes(bobOrderId), 'Bob should see his own order');
    assert.ok(!orderIds.includes(aliceOrderId), 'Bob must NOT see Alice order');

    body.data.forEach((o) => {
      assert.strictEqual(o.userId, bobUser.id);
    });
  });

  test('Customer cannot spoof ?userId query to see another customer orders', async () => {
    const res = await fetch(`${baseUrl}/api/orders?userId=${bobUser.id}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    const orderIds = body.data.map((o) => o.id);
    assert.ok(!orderIds.includes(bobOrderId), 'Alice must NOT see Bob order even with ?userId');
    body.data.forEach((o) => {
      assert.strictEqual(o.userId, aliceUser.id);
    });
  });

  test('Customer cannot access another customer order directly by ID (403)', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${bobOrderId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.error, /access denied/i);
  });

  test('Admin dashboard sees all orders from both customers', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const orderIds = body.data.map((o) => o.id);
    assert.ok(orderIds.includes(aliceOrderId), 'Admin should see Alice order');
    assert.ok(orderIds.includes(bobOrderId), 'Admin should see Bob order');
  });

  test('Orders are preserved in database across logout (logging out does NOT delete orders)', async () => {
    // Simulate logout by discarding client token and querying unauthenticated
    const unauthRes = await fetch(`${baseUrl}/api/orders`);
    assert.strictEqual(unauthRes.status, 401);

    // Verify both orders still exist in backend database
    const dbAliceOrder = await Order.findByPk(aliceOrderId);
    assert.ok(dbAliceOrder, 'Alice order must remain in database after logout');
    assert.strictEqual(dbAliceOrder.userId, aliceUser.id);

    const dbBobOrder = await Order.findByPk(bobOrderId);
    assert.ok(dbBobOrder, 'Bob order must remain in database after logout');
    assert.strictEqual(dbBobOrder.userId, bobUser.id);
  });

  test('Re-logging in after logout fetches user orders again', async () => {
    // Re-login Alice with fresh login request
    const reLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'switch_alice@example.com', password: 'Password123!' }),
    });
    const freshToken = (await reLoginRes.json()).data.token;

    const ordersRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    assert.strictEqual(ordersRes.status, 200);
    const body = await ordersRes.json();
    const orderIds = body.data.map((o) => o.id);
    assert.ok(orderIds.includes(aliceOrderId), 'Alice should retrieve her order after re-logging in');
  });
});
