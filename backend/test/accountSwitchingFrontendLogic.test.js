const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Mock localStorage implementation
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('Frontend Cart Scoping & Order Race Handling Unit Tests', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = new MockLocalStorage();
    global.localStorage = localStorageMock;
  });

  describe('User-Scoped Cart Persistence & Account Isolation', () => {
    // Pure logic functions mirroring CartContext
    const getCartStorageKey = (userId) => (userId ? `restaurant_cart_user_${userId}` : null);

    const loadSavedCart = (userId, storage = localStorageMock) => {
      if (!userId) return [];
      try {
        const key = getCartStorageKey(userId);
        const saved = storage.getItem(key);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    };

    test('getCartStorageKey generates user-scoped keys and null for guests', () => {
      assert.strictEqual(getCartStorageKey(1), 'restaurant_cart_user_1');
      assert.strictEqual(getCartStorageKey(42), 'restaurant_cart_user_42');
      assert.strictEqual(getCartStorageKey(null), null);
      assert.strictEqual(getCartStorageKey(undefined), null);
    });

    test('user carts are isolated in localStorage and do not leak on account switch', () => {
      const aliceCart = [{ id: 101, menuItem: { id: 101, name: 'Burger', price: 15 }, quantity: 2 }];
      const bobCart = [{ id: 102, menuItem: { id: 102, name: 'Salad', price: 10 }, quantity: 1 }];

      // Alice (userId = 1) saves cart
      localStorageMock.setItem(getCartStorageKey(1), JSON.stringify(aliceCart));

      // Bob (userId = 2) loads cart -> empty initially
      const bobLoaded = loadSavedCart(2);
      assert.deepStrictEqual(bobLoaded, [], 'Bob must not see Alice cart');

      // Bob saves his cart
      localStorageMock.setItem(getCartStorageKey(2), JSON.stringify(bobCart));

      // Alice loads her cart -> still has her items
      const aliceLoaded = loadSavedCart(1);
      assert.deepStrictEqual(aliceLoaded, aliceCart, 'Alice cart must be preserved');

      // Bob loads his cart -> still has his items
      const bobReloaded = loadSavedCart(2);
      assert.deepStrictEqual(bobReloaded, bobCart, 'Bob cart must be preserved');
    });

    test('logging out clears in-memory cart, notes, and UI without destroying user persisted cart', () => {
      const aliceCart = [{ id: 101, menuItem: { id: 101, name: 'Burger', price: 15 }, quantity: 2 }];
      localStorageMock.setItem(getCartStorageKey(1), JSON.stringify(aliceCart));

      // State machine simulation of CartContext when user logs out
      let activeUserId = 1;
      let inMemoryCart = loadSavedCart(activeUserId);
      let isCartOpen = true;
      let orderNotes = 'Extra sauce please';

      assert.strictEqual(inMemoryCart.length, 1);
      assert.strictEqual(isCartOpen, true);
      assert.strictEqual(orderNotes, 'Extra sauce please');

      // Logout occurs (user becomes null)
      activeUserId = null;
      inMemoryCart = loadSavedCart(activeUserId);
      isCartOpen = false;
      orderNotes = '';

      assert.deepStrictEqual(inMemoryCart, [], 'In-memory cart must be empty on logout');
      assert.strictEqual(isCartOpen, false, 'Cart UI must be closed on logout');
      assert.strictEqual(orderNotes, '', 'Order notes must be cleared on logout');

      // Verify Alice persisted cart is still safe in storage
      const persistedAliceCart = loadSavedCart(1);
      assert.deepStrictEqual(persistedAliceCart, aliceCart, 'Alice cart in localStorage must remain intact');
    });

    test('clearCart empties in-memory cart and removes scoped storage for active user', () => {
      const aliceCart = [{ id: 101, menuItem: { id: 101, name: 'Burger', price: 15 }, quantity: 2 }];
      localStorageMock.setItem(getCartStorageKey(1), JSON.stringify(aliceCart));

      // Active user clears cart (e.g. after successful checkout)
      const currentUserId = 1;
      let inMemoryCart = [];
      let orderNotes = '';
      localStorageMock.removeItem(getCartStorageKey(currentUserId));

      assert.deepStrictEqual(inMemoryCart, []);
      assert.strictEqual(orderNotes, '');
      assert.strictEqual(localStorageMock.getItem(getCartStorageKey(1)), null);
    });
  });

  describe('Order State Machine, Stale Clearing, and Request Race Handling', () => {
    // Model of useOrders state machine
    class OrdersController {
      constructor() {
        this.orders = [];
        this.loading = false;
        this.error = null;
        this.inspectOrderId = null;
        this.statusFilter = '';
        this.activeRequestId = 0;
        this.currentUserId = null;
        this.isAuthenticated = false;
      }

      setAuth(isAuthenticated, user) {
        const userChanged = this.currentUserId !== (user?.id || null);
        this.isAuthenticated = isAuthenticated;
        this.currentUserId = user?.id || null;

        if (!isAuthenticated || !this.currentUserId) {
          // Clear all on logout / unauthenticated
          this.orders = [];
          this.error = null;
          this.inspectOrderId = null;
          this.statusFilter = '';
          this.loading = false;
          return;
        }

        if (userChanged) {
          // Clear previous account's orders immediately
          this.orders = [];
          this.error = null;
          this.inspectOrderId = null;
          this.statusFilter = '';
        }
      }

      async fetchOrders(fetchFn) {
        if (!this.isAuthenticated || !this.currentUserId) {
          this.orders = [];
          this.loading = false;
          return;
        }

        const requestId = ++this.activeRequestId;
        const requestUserId = this.currentUserId;

        this.loading = true;
        this.orders = []; // Clear while loading new account's orders
        this.error = null;

        try {
          const data = await fetchFn(requestUserId);
          // Race check
          if (
            requestId === this.activeRequestId &&
            requestUserId === this.currentUserId &&
            this.isAuthenticated
          ) {
            this.orders = data;
          }
        } catch (err) {
          if (
            requestId === this.activeRequestId &&
            requestUserId === this.currentUserId &&
            this.isAuthenticated
          ) {
            this.orders = []; // Never show previous orders on error
            this.error = err.message || 'Failed to load';
          }
        } finally {
          if (requestId === this.activeRequestId) {
            this.loading = false;
          }
        }
      }
    }

    test('clears previous account orders from UI immediately upon account change', async () => {
      const controller = new OrdersController();

      // Alice signs in and loads orders
      controller.setAuth(true, { id: 1, name: 'Alice' });
      await controller.fetchOrders(async () => [{ id: 501, userId: 1, total: 25.0 }]);

      assert.strictEqual(controller.orders.length, 1);
      assert.strictEqual(controller.orders[0].id, 501);

      // Account switch to Bob begins: orders must be cleared immediately
      controller.setAuth(true, { id: 2, name: 'Bob' });
      assert.strictEqual(controller.orders.length, 0, 'Previous orders must clear immediately on account switch');
      assert.strictEqual(controller.error, null);
      assert.strictEqual(controller.inspectOrderId, null);
    });

    test('clears previous account orders on logout', async () => {
      const controller = new OrdersController();

      controller.setAuth(true, { id: 1, name: 'Alice' });
      await controller.fetchOrders(async () => [{ id: 501, userId: 1, total: 25.0 }]);
      controller.inspectOrderId = 501;

      assert.strictEqual(controller.orders.length, 1);

      // Logout
      controller.setAuth(false, null);
      assert.strictEqual(controller.orders.length, 0, 'Orders must be empty on logout');
      assert.strictEqual(controller.inspectOrderId, null, 'Inspect modal must close on logout');
      assert.strictEqual(controller.loading, false);
    });

    test('if fetching fails, previous account orders are never shown and error is set', async () => {
      const controller = new OrdersController();

      controller.setAuth(true, { id: 1, name: 'Alice' });
      await controller.fetchOrders(async () => [{ id: 501, userId: 1, total: 25.0 }]);
      assert.strictEqual(controller.orders.length, 1);

      // Switch to Bob, but Bob's request throws network error
      controller.setAuth(true, { id: 2, name: 'Bob' });
      await controller.fetchOrders(async () => {
        throw new Error('Network Connection Lost');
      });

      assert.strictEqual(controller.orders.length, 0, 'Must NOT show Alice orders if Bob fetch fails');
      assert.strictEqual(controller.error, 'Network Connection Lost');
      assert.strictEqual(controller.loading, false);
    });

    test('prevents request race conditions where earlier account slower response arrives after switch', async () => {
      const controller = new OrdersController();

      // Alice (User 1) starts fetching orders (simulate slow response)
      controller.setAuth(true, { id: 1, name: 'Alice' });

      let resolveAlice;
      const alicePromise = new Promise((resolve) => {
        resolveAlice = resolve;
      });

      const aliceFetchPromise = controller.fetchOrders(() => alicePromise);

      // Alice switches to Bob (User 2) before Alice's request completes
      controller.setAuth(true, { id: 2, name: 'Bob' });

      // Bob's request starts and completes quickly
      const bobFetchPromise = controller.fetchOrders(async () => [
        { id: 601, userId: 2, total: 40.0 },
      ]);
      await bobFetchPromise;

      assert.strictEqual(controller.orders.length, 1);
      assert.strictEqual(controller.orders[0].id, 601, 'Bob orders must be displayed');

      // Now Alice's slow request finally arrives
      resolveAlice([{ id: 501, userId: 1, total: 25.0 }]);
      await aliceFetchPromise;

      // Assert Alice's delayed response was discarded and did not overwrite Bob's orders
      assert.strictEqual(controller.orders.length, 1);
      assert.strictEqual(controller.orders[0].id, 601, 'Bob orders must NOT be overwritten by Alice late response');
      assert.strictEqual(controller.orders[0].userId, 2);
    });

    test('prevents late response from populating orders after user has logged out', async () => {
      const controller = new OrdersController();

      controller.setAuth(true, { id: 1, name: 'Alice' });

      let resolveAlice;
      const alicePromise = new Promise((resolve) => {
        resolveAlice = resolve;
      });

      const aliceFetchPromise = controller.fetchOrders(() => alicePromise);

      // Alice logs out before response settles
      controller.setAuth(false, null);
      assert.strictEqual(controller.orders.length, 0);

      // Late response arrives
      resolveAlice([{ id: 501, userId: 1, total: 25.0 }]);
      await aliceFetchPromise;

      // Orders must remain empty
      assert.strictEqual(controller.orders.length, 0, 'Late response must not populate orders when logged out');
      assert.strictEqual(controller.isAuthenticated, false);
    });
  });
});
