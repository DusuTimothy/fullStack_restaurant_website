const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { sequelize, User, Category, MenuItem } = require('../src/models');

let server;
let baseUrl;
let customerToken;
let adminToken;
let testCategory;
let testMenuItem;

describe('Admin Category and Menu Item Management Tests', () => {
  before(async () => {
    await sequelize.authenticate();

    const testPassword = await bcrypt.hash('Password123!', 10);
    const [customer] = await User.findOrCreate({
      where: { email: 'alice@example.com' },
      defaults: { name: 'Alice Johnson', role: 'customer', password: testPassword },
    });
    await customer.update({ password: testPassword });

    const [admin] = await User.findOrCreate({
      where: { email: 'sarah@restaurant.com' },
      defaults: { name: 'Sarah Connor', role: 'admin', password: testPassword },
    });
    await admin.update({ role: 'admin', password: testPassword });

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const custLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' }),
    });
    customerToken = (await custLogin.json()).data.token;

    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah@restaurant.com', password: 'Password123!' }),
    });
    adminToken = (await adminLogin.json()).data.token;

    // Create a temporary category for tests
    testCategory = await Category.create({
      name: `Test Cat ${Date.now()}`,
      description: 'Test category description',
    });

    // Create a temporary menu item for tests
    testMenuItem = await MenuItem.create({
      name: `Test Dish ${Date.now()}`,
      description: 'Delicious dish',
      price: 15.50,
      categoryId: testCategory.id,
      isAvailable: true,
    });
  });

  after(async () => {
    if (testMenuItem) {
      await MenuItem.destroy({ where: { id: testMenuItem.id } });
    }
    if (testCategory) {
      await Category.destroy({ where: { id: testCategory.id } });
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Category Update (PUT /api/categories/:id)', () => {
    test('non-admin customer cannot update category (403)', async () => {
      const res = await fetch(`${baseUrl}/api/categories/${testCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });
      assert.strictEqual(res.status, 403);
    });

    test('admin can update category name and description', async () => {
      const updatedName = `Updated Cat ${Date.now()}`;
      const updatedDesc = 'Updated category description';

      const res = await fetch(`${baseUrl}/api/categories/${testCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: updatedName, description: updatedDesc }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, updatedName);
      assert.strictEqual(body.data.description, updatedDesc);
      assert.strictEqual(body.data.itemCount, 1);
    });

    test('rejects duplicate category name on update (409)', async () => {
      const anotherCat = await Category.create({
        name: `Sibling Cat ${Date.now()}`,
      });

      const res = await fetch(`${baseUrl}/api/categories/${testCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: anotherCat.name }),
      });

      await anotherCat.destroy();
      assert.strictEqual(res.status, 409);
    });
  });

  describe('Menu Item Update (PUT /api/menu-items/:id)', () => {
    test('non-admin customer cannot update menu item (403)', async () => {
      const res = await fetch(`${baseUrl}/api/menu-items/${testMenuItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ price: 1.00 }),
      });
      assert.strictEqual(res.status, 403);
    });

    test('admin can update menu item fields (name, price, isAvailable, description)', async () => {
      const updatedName = `Updated Dish ${Date.now()}`;
      const res = await fetch(`${baseUrl}/api/menu-items/${testMenuItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: updatedName,
          price: 24.99,
          description: 'Updated succulent steak',
          isAvailable: false,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, updatedName);
      assert.strictEqual(body.data.price, 24.99);
      assert.strictEqual(body.data.isAvailable, false);
      assert.strictEqual(body.data.description, 'Updated succulent steak');
      assert.strictEqual(body.data.category.id, testCategory.id);
    });

    test('returns 400 if updating menu item with invalid category ID', async () => {
      const res = await fetch(`${baseUrl}/api/menu-items/${testMenuItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ categoryId: 999999 }),
      });

      assert.strictEqual(res.status, 400);
    });
  });
});
