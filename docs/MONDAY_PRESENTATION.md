# Monday Presentation Walkthrough

This is a short demonstration plan for presenting the Restaurant Management System. Run the demo against a local, disposable PostgreSQL database so you can create test data without risking real data.

## Before class

1. Install dependencies from the repository root:

   ```bash
   npm run install:all
   ```

2. Create a local PostgreSQL database and application user; configure `backend/.env` using `backend/.env.example` as a template. Keep credentials private.

3. For a local demo database, configure `SEED_USER_PASSWORD` in `backend/.env` and seed sample data:

   ```bash
   npm run seed
   ```

   `npm run seed` uses non-destructive table synchronization (`force: false`). If you need to completely wipe and recreate tables during practice, use the explicit development reset command `npm run db:reset`. Both commands strictly refuse to execute in production or against remote databases. No admin account or default admin password is ever seeded.

4. Provision an administrator account for the demonstration using the trusted operator CLI:

   ```bash
   npm run admin:create -- admin@restaurant.com "Demo Admin"
   ```

   Follow the masked password prompt (without terminal echo) and confirm the creation.

5. Start the backend and frontend:

   ```bash
   npm run dev
   ```

   Check `http://localhost:5000/api/health`; open the Vite URL printed in the terminal (normally `http://localhost:5173`).

6. If the live presentation must create menu items, sign in as the administrator created in step 4. In a real deployment, administrators must always be created/promoted through this trusted backend operator CLI, never public signup or HTTP endpoints.

## Suggested 8–10 minute sequence

### 1. Show PostgreSQL tables

Explain that the backend connects to PostgreSQL via settings in `backend/.env`, while credentials never go to the browser.

```bash
sudo -u postgres psql -d restaurant_db
```

In `psql`:

```sql
\dt
\d menu_items
\d orders
\d order_items
```

Describe the foreign keys:

- `menu_items.categoryId` references `categories.id`.
- `orders.userId` references `users.id`.
- `order_items.orderId` references `orders.id`.
- `order_items.menuItemId` references `menu_items.id`.

Use the [database guide](DATABASE_SCHEMA.md) to explain the one-to-many relationships and why order line items preserve the purchase-time price.

### 2. Show the Express API

Show the routes under `backend/src/routes/`, validation schemas under `backend/src/schemas/`, controllers under `backend/src/controllers/`, service modules under `backend/src/services/`, and Sequelize models under `backend/src/models/`.

Open `http://localhost:5000/api/health`. Explain that a route validates an incoming request, its controller handles the HTTP request and delegates business and persistence work to a service, and Express returns JSON with an HTTP status.

### 3. Show the frontend and dynamic menu

Open the Vite frontend. Show categories and menu items rendered from API responses rather than hard-coded page data. The page fetches:

- `GET /api/categories`
- `GET /api/menu-items`

In browser developer tools, open **Network**, reload the page, and show the frontend's HTTP requests and JSON responses. See [API and frontend integration](API_AND_FRONTEND_INTEGRATION.md) for source-file references.

### 4. Create and view a menu item

Sign in using a local demo admin account. Use the admin menu controls to create a menu item and upload an optional image. Explain:

- The frontend submits `POST /api/menu-items` as `multipart/form-data`.
- The API requires admin authorization, validates fields, verifies the category foreign key, and stores the image under the backend uploads directory.
- The `201 Created` response includes the saved item; the UI refreshes and displays it.

If there is no time for UI creation, show the request in the API guide instead. Do not change a real or shared database for a presentation.

### 5. Create an order

Sign up or log in as a customer, add a menu item to the cart, then submit the order. In Network, show:

- `POST /api/orders`
- `Authorization: Bearer ...`
- A body containing menu item IDs, quantities, and optional notes
- A `201 Created` response containing the order and its items

Explain that the backend derives the customer identity from the JWT. It does not trust a client-provided `userId`; it reloads the current menu prices and saves the order and line items in one transaction.

### 6. View the order and its items

Open the Orders page and select the new order. Show the request to `GET /api/orders` and/or `GET /api/orders/:id`, then show the nested user, item names, quantities, prices, and totals in the response/UI. Customers can see their own orders; staff/admin can use the management dashboard.

### 7. Summarize the end-to-end data flow

```text
User action in React
  -> Axios HTTP request
  -> Express route and validation
  -> Controller
  -> Service business logic and Sequelize model
  -> PostgreSQL row(s), with foreign keys
  <- JSON response with HTTP status
  <- React renders updated database-backed data
```

## Questions to be ready for

- **Where are credentials stored?** In the backend's private `.env`, not frontend code or Git.
- **What validates API input?** Zod schemas and route validation middleware.
- **How is order data related?** An order belongs to a user; its line items connect the order to menu items and preserve order-time prices.
- **How does the API prevent fake order owners?** It derives `userId` from the authenticated JWT.
- **What does a foreign key do?** It ensures a referenced user/category/order/menu item exists and prevents orphaned records.
- **What does the frontend send?** HTTP requests through the shared Axios client; successful JSON responses populate the React UI.
- **What should not be run on production?** `npm run db:reset` (drops and recreates tables) and `npm run seed`. Both commands contain strict automated safeguards that reject execution when `NODE_ENV=production` or targeting remote databases.

## Submission checklist

- Backend source: `backend/src/`
- Frontend source: `frontend/src/`
- Database/table/relationship notes: [Database structure](DATABASE_SCHEMA.md)
- API endpoints and request examples: [API integration](API_AND_FRONTEND_INTEGRATION.md)
- Local install/run guide: [project README](../README.md)
- This presentation walkthrough

If your instructor requires an importable Postman or Thunder Client collection, export one from the endpoint examples in the API guide. A Markdown API reference explains the requests but is not itself an importable collection.
