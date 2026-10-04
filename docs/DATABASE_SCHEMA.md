# Database Structure

The backend uses Sequelize models in `backend/src/models/` and association declarations in `backend/src/models/index.js`. Service modules in `backend/src/services/` apply business rules and perform database operations through those models. PostgreSQL is the expected database for the class presentation. SQLite is also supported for local experiments.

At startup, `backend/src/server.js` authenticates the connection and runs:

```js
await sequelize.sync({ alter: false });
```

This creates missing tables, but it does not update an existing table when model definitions change. Use explicit schema migrations for deployed databases. Ordinary seeding (`npm run seed`) is non-destructive (`force: false`) and will refuse to run on populated databases. Destructive recreation is an explicit development-only command (`npm run db:reset`) protected by production and locality safeguards.

## Tables and fields

### `users`

| Column | Type / constraint | Purpose |
|---|---|---|
| `id` | Integer, primary key, auto-increment | User identifier |
| `name` | String, required | Display name |
| `email` | String, required, unique | Login identifier |
| `role` | Enum: `customer`, `staff`, `admin`; defaults to `customer` | Authorization role (admin granted only via operator CLI) |
| `phone` | String, nullable | Optional contact phone |
| `password` | String, nullable for legacy accounts | Backend-stored password hash; never returned by API |
| `createdAt`, `updatedAt` | Timestamps | Sequelize timestamps |

### `categories`

| Column | Type / constraint | Purpose |
|---|---|---|
| `id` | Integer, primary key, auto-increment | Category identifier |
| `name` | String, required, unique | Category label |
| `description` | Text, nullable | Optional description |
| `createdAt`, `updatedAt` | Timestamps | Sequelize timestamps |

### `menu_items`

| Column | Type / constraint | Purpose |
|---|---|---|
| `id` | Integer, primary key, auto-increment | Menu item identifier |
| `name` | String, required | Item name |
| `description` | Text, nullable | Item description |
| `price` | Decimal(10,2), required | Current menu price |
| `categoryId` | Integer, required, FK to `categories.id` | Item's category |
| `imageUrl` | String, nullable | External URL or uploaded image path |
| `isAvailable` | Boolean, required, defaults to true | Whether customers can order it |
| `createdAt`, `updatedAt` | Timestamps | Sequelize timestamps |

### `orders`

| Column | Type / constraint | Purpose |
|---|---|---|
| `id` | Integer, primary key, auto-increment | Order identifier |
| `userId` | Integer, required, FK to `users.id` | Customer who owns the order |
| `status` | Enum: `pending`, `preparing`, `ready`, `completed`, `cancelled` | Order state |
| `totalAmount` | Decimal(10,2), required | Server-calculated total |
| `notes` | Text, nullable | Customer/order notes |
| `createdAt`, `updatedAt` | Timestamps | Sequelize timestamps |

### `order_items`

| Column | Type / constraint | Purpose |
|---|---|---|
| `id` | Integer, primary key, auto-increment | Order line identifier |
| `orderId` | Integer, required, FK to `orders.id` | Parent order |
| `menuItemId` | Integer, required, FK to `menu_items.id` | Ordered menu item |
| `quantity` | Integer, required, at least 1 | Number ordered |
| `unitPrice` | Decimal(10,2), required | Price copied at order time |
| `subtotal` | Decimal(10,2), required | Quantity × unit price |
| `createdAt`, `updatedAt` | Timestamps | Sequelize timestamps |

## Relationship diagram

```text
categories  1 ───────< many  menu_items
users       1 ───────< many  orders
orders      1 ───────< many  order_items  many >────── 1  menu_items
```

Equivalent relationship list:

- One category has many menu items; each menu item belongs to one category.
- One user has many orders; each order belongs to one user.
- One order has many order items; each order item belongs to one order.
- One menu item can appear on many order items; each order item references one menu item.
- `order_items` is the join/line-item table between orders and menu items. It also stores the unit price and subtotal at purchase time.

The foreign-key fields are `menu_items.categoryId`, `orders.userId`, `order_items.orderId`, and `order_items.menuItemId`. The `order_items.orderId` relation cascades when its parent order is deleted. The category-to-menu-items association restricts deleting categories that still have items.

## Inspect the PostgreSQL database

Connect to the database configured in `backend/.env` (the examples below use `restaurant_db`):

```bash
sudo -u postgres psql -d restaurant_db
```

At the `psql` prompt:

```sql
\dt
\d users
\d categories
\d menu_items
\d orders
\d order_items
```

To query example rows:

```sql
SELECT id, name, email, role FROM users ORDER BY id;
SELECT id, name, price, "categoryId" FROM menu_items ORDER BY id;
SELECT id, "userId", status, "totalAmount" FROM orders ORDER BY id;
SELECT "orderId", "menuItemId", quantity, "unitPrice", subtotal
FROM order_items
ORDER BY "orderId", id;
```

PostgreSQL identifiers created by Sequelize may be quoted camel case (`"categoryId"`, `"userId"`, `"orderId"`, `"menuItemId"`, `"createdAt"`). Quote those names exactly when writing SQL.

## Demonstrating transactional order creation

The API checks that the authenticated customer exists and that each requested menu item exists and is available. It reads the current menu prices, calculates line subtotals and the order total on the server, then creates the `orders` row and all `order_items` rows within one Sequelize transaction. If the transaction fails, it rolls back rather than leaving a partially created order.

See [the API guide](API_AND_FRONTEND_INTEGRATION.md#create-an-order) for a request example.
