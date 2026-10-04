# API and Frontend Integration

This guide documents the Express API currently mounted under `/api` and the way the React/Vite frontend consumes it.

## Request and data flow

```text
React page or component
  -> Axios client (frontend/src/api/axiosClient.js)
  -> HTTP request to http://localhost:5000/api/...
  -> Express middleware, route, validation, and controller
  -> service business logic and persistence
  -> Sequelize model/association
  -> PostgreSQL
  <- JSON response and HTTP status
  <- React updates the page
```

The frontend's Axios instance uses `VITE_API_URL` when set, otherwise it builds the API URL from `VITE_BACKEND_URL` (defaulting to `http://localhost:5000`) and `/api`. It attaches a saved JWT as `Authorization: Bearer <token>`. Database credentials stay in `backend/.env` and are used only by the server.

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Create a customer account; returns a JWT and user object |
| `POST` | `/api/auth/login` | Public | Verify email/password; returns a JWT and user object |
| `GET` | `/api/auth/me` | Authenticated | Return the current user's profile |

Example signup:

```http
POST /api/auth/signup
Content-Type: application/json
```

```json
{
  "name": "Alex Example",
  "email": "alex@example.com",
  "password": "Use-a-local-demo-password",
  "phone": "555-0100"
}
```

Public signup always assigns the `customer` role. Do not send or rely on a client-supplied role. Passwords are hashed by the backend, and they are never returned in user responses.

Example login:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "alex@example.com",
  "password": "Use-a-local-demo-password"
}
```

Successful authentication returns an object shaped like:

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": 12,
      "name": "Alex Example",
      "email": "alex@example.com",
      "role": "customer",
      "phone": "555-0100"
    }
  }
}
```

For protected API calls, send:

```http
Authorization: Bearer <jwt>
```

Example:

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT"
```

The application creates or promotes administrator accounts strictly through the backend operator CLI (`npm run admin:create` / `npm run admin:promote`), never through public signup or HTTP APIs. Keep that CLI and server/database credentials restricted to trusted operators.

## Endpoint reference

`*` means a valid JWT is required. **Admin** means the JWT must belong to an administrator. Customer order requests are restricted to that customer's own orders; staff/admin order views can access the management dashboard's broader order list.

| Method | Endpoint | Access | Request / behavior |
|---|---|---|---|
| `GET` | `/api/health` | Public | API health, uptime, and timestamp |
| `GET` | `/api/categories` | Public | List categories |
| `GET` | `/api/categories/:id` | Public | Fetch one category |
| `POST` | `/api/categories` | Admin | Create category; JSON |
| `PUT` | `/api/categories/:id` | Admin | Update category; JSON |
| `DELETE` | `/api/categories/:id` | Admin | Delete category when allowed by relationships |
| `GET` | `/api/menu-items` | Public | List items; optional `?category_id=ID` filter |
| `GET` | `/api/menu-items/:id` | Public | Fetch one menu item |
| `POST` | `/api/menu-items` | Admin | Create item; JSON or `multipart/form-data` with optional `image` |
| `PUT` | `/api/menu-items/:id` | Admin | Update item; JSON or `multipart/form-data` |
| `DELETE` | `/api/menu-items/:id` | Admin | Delete menu item |
| `GET` | `/api/orders` | * | List orders; optional `?status=pending`; customers only see their own |
| `GET` | `/api/orders/:id` | * | Fetch an order with user and line-item/menu-item details; customers only see their own |
| `POST` | `/api/orders` | * | Create an order with item IDs and quantities; server derives the owner from the JWT |
| `PATCH` | `/api/orders/:id/status` | * | Staff/admin can update status; customer can only cancel their own pending order |
| `DELETE` | `/api/orders/:id` | * | Delete/cancel order; customer can only delete their own pending order |
| `GET` | `/api/users` | Admin | List users |
| `GET` | `/api/users/:id` | * | Fetch user details; access is controlled by the user controller |
| `POST` | `/api/users` | Admin | Admin user creation endpoint (`customer` or `staff` only; `admin` role is rejected) |
| `PUT` | `/api/users/:id` | * | Update user profile; non-admins cannot change role; `admin` role cannot be granted via API |
| `DELETE` | `/api/users/:id` | Admin | Delete user |

### Create a category

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Desserts","description":"Sweet dishes"}'
```

The response is `201 Created` and contains the new category in `data`.

### Create a menu item

The referenced category must exist. Upload an image as a multipart field named `image`:

```bash
curl -X POST http://localhost:5000/api/menu-items \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -F 'name=Chocolate Cake' \
  -F 'description=Warm cake with chocolate center' \
  -F 'price=8.50' \
  -F 'categoryId=1' \
  -F 'isAvailable=true' \
  -F 'image=@./cake.jpg'
```

Allowed uploaded image types and size are enforced by the upload middleware. The resulting relative URL is served under `/uploads`.

### Create an order

`items` must contain at least one existing, available menu item. The backend calculates prices and totals from database menu-item records inside a transaction; a client cannot select another user as the order owner.

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_CUSTOMER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuItemId":1,"quantity":2}],"notes":"No onions"}'
```

The response is `201 Created`; `data` includes the created order and its associated user and line items.

### Fetch an order and its items

```bash
curl http://localhost:5000/api/orders/1 \
  -H "Authorization: Bearer YOUR_JWT"
```

The order response includes the related user and `items`, with each item's menu-item details.

## Validation and errors

Incoming JSON is validated using Zod schemas before controllers execute. Menu-item multipart fields are converted from strings to numeric/boolean values before validation. A validation failure is normally `400 Bad Request` with structured JSON:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "Name must be at least 2 characters" }
  ]
}
```

Common status codes:

| Status | Meaning |
|---|---|
| `200 OK` | Successful read/update/delete operation |
| `201 Created` | Account, category, menu item, or order created |
| `400 Bad Request` | Invalid input, uploaded file too large/unsupported, or referenced record does not exist |
| `401 Unauthorized` | Missing/invalid/expired JWT or invalid login |
| `403 Forbidden` | Authenticated user lacks access to the requested operation/data |
| `404 Not Found` | Requested record or route does not exist |
| `409 Conflict` | Duplicate email/category or other uniqueness conflict |
| `500 Internal Server Error` | Unexpected server/database error |

## Frontend integration points

- `frontend/src/api/axiosClient.js`: API base URL, token request header, unauthorized-session handling, and uploaded-image URL resolution.
- `frontend/src/context/AuthContext.jsx`: signup, login, session validation, and logout.
- `frontend/src/pages/MenuPage.jsx`: fetches categories and menu items and renders data returned by the API.
- `frontend/src/components/CartDrawer.jsx`: sends `POST /orders` when a signed-in customer submits their cart.
- `frontend/src/pages/OrdersPage.jsx`: fetches and displays order data from `GET /orders`.
- `frontend/src/components/AddMenuItemModal.jsx`: sends multipart menu-item data and an image to `POST /menu-items`.
- `backend/src/routes/`: endpoint definitions and middleware composition.
- `backend/src/controllers/`: HTTP request/response handling.
- `backend/src/services/`: business rules and persistence operations used by controllers.
- `backend/src/schemas/`: request validation schemas.
