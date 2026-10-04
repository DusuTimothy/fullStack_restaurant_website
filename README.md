# Restaurant Management System

A full-stack restaurant ordering and management application. The frontend is built with React and Vite; the backend is an Express API using Sequelize with PostgreSQL (or SQLite for local experiments).

## Documentation

- [Local setup and submission checklist](#local-setup)
- [API and frontend integration guide](docs/API_AND_FRONTEND_INTEGRATION.md)
- [Database structure and relationships](docs/DATABASE_SCHEMA.md)
- [Monday presentation walkthrough](docs/MONDAY_PRESENTATION.md)

## Requirements

- Node.js 20.19+ or 22.12+ and npm (required by the current Vite toolchain)
- PostgreSQL for the database presentation (SQLite is also supported by the backend)

## Local setup

1. Install project dependencies from the repository root:

   ```bash
   npm run install:all
   ```

2. Create a PostgreSQL database and database user, and grant that user access to the database. For example, as the PostgreSQL administrator:

   ```bash
   sudo -u postgres psql
   ```

   In the PostgreSQL prompt:

   ```sql
   CREATE USER restaurant_app WITH PASSWORD 'choose-a-local-password';
   CREATE DATABASE restaurant_db OWNER restaurant_app;
   \q
   ```

   Replace the example password with your own local secret.

3. Copy `backend/.env.example` to `backend/.env` and fill in the local database connection details:

   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=restaurant_db
   DB_USER=restaurant_app
   DB_PASSWORD=your-local-database-password
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
   JWT_EXPIRES_IN=24h
   SEED_USER_PASSWORD=choose-a-local-development-sample-password
   ```

   Keep `.env` private; do not commit or share it. `SEED_USER_PASSWORD` is required for seeding local sample customer and staff accounts; never configure or use sample passwords in production. The frontend uses `http://localhost:5000/api` by default. Set `VITE_BACKEND_URL` or `VITE_API_URL` in the frontend environment only if your backend uses a different URL. Do not put database credentials in the frontend.

4. Seed initial development sample data (non-destructive):

   ```bash
   npm run seed
   ```

   `npm run seed` synchronizes tables safely without dropping existing data. If the database already contains tables with data, the command aborts to protect your data. Note: Seed data creates sample categories, menu items, and non-admin sample users (customer and staff). It **never seeds an administrator account or predictable admin credentials**.

5. Provision an administrator account using the trusted operator CLI:

   ```bash
   npm run admin:create -- admin@restaurant.com "System Administrator"
   ```

   You will be securely prompted for an admin password (minimum 6 characters, masked without terminal echo) and prompted for confirmation. Alternatively, promote an existing registered customer:

   ```bash
   npm run admin:promote -- user@example.com
   ```

   In automated/CI environments, supply `ADMIN_PASSWORD` in the environment and pass `--confirm`.

6. Start the backend and frontend together:

   ```bash
   npm run dev
   ```

   The API is at `http://localhost:5000`, the Vite frontend is at `http://localhost:5173`, and `GET http://localhost:5000/api/health` is the health check.

7. Open `http://localhost:5173`. Menu browsing is public; ordering requires signing in with a customer account (or creating one via Sign up). Only administrators can access the admin dashboard to manage menu items, categories, and view all orders.

The backend authenticates the database and calls `sequelize.sync({ alter: false })` at startup. This creates missing tables but does not migrate or alter existing tables. Apply an appropriate schema migration or use a disposable development database when model columns change.

## Database Seeding, Resets, and Production Safeguards

- **Safe Seeding (`npm run seed`):** Uses non-destructive table synchronization (`force: false`). Refuses to overwrite or duplicate records if data already exists in the target database. Strictly refuses to run when `NODE_ENV=production` or targeting remote databases.
- **Destructive Development Reset (`npm run db:reset`):** Explicit, development-only command that drops and recreates tables (`force: true`) before seeding demo data. Protected by environment and locality checks: strictly refuses to run if `NODE_ENV=production` or if the target database host or name indicates a live or production environment.
- **No Hardcoded Admin Credentials:** Administrator accounts are never seeded. Operators must provision admins explicitly through the CLI. Development sample users require `SEED_USER_PASSWORD` in `backend/.env`; the system never falls back to a public or default password.
- **Role Escalation Protection:** Public signups always assign the `customer` role. Admin-only endpoints require valid JWT authentication with verified `admin` role. API endpoints (`POST /api/users` and `PUT /api/users/:id`) strictly forbid creating or elevating accounts to `admin` through HTTP requests; admin privileges can only be granted via the operator CLI.
- **Admin CLI Hardening (`backend/src/scripts/manageAdmin.js`):** Validates commands, email formats, and user existence before executing database changes. Prohibits passing passwords as positional command-line arguments to avoid exposure in shell history and process listings (`ps`). Requires explicit operator confirmation (`--confirm` or interactive prompt) and logs audit messages without printing secrets or hashes. Closes database connections cleanly on both success and error.

## API and database

The backend exposes CRUD endpoints for users, categories, menu items, and orders. JSON bodies are validated with Zod; menu-item creation also supports multipart image uploads. Responses use JSON and standard HTTP status codes. Protected requests use a JWT in `Authorization: Bearer <token>`.

Route handlers delegate business and persistence logic to service modules, which use Sequelize models. See [API and frontend integration](docs/API_AND_FRONTEND_INTEGRATION.md) for endpoint details and working examples, [database structure](docs/DATABASE_SCHEMA.md) for tables/foreign keys, and the [presentation walkthrough](docs/MONDAY_PRESENTATION.md) for the class demonstration.

## Submission checklist

- `backend/src/`: Express server, routes, controllers, services, models, validation, and middleware.
- `frontend/src/`: React pages, components, state, and API client.
- Database structure: see [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md); PostgreSQL tables are synchronized from Sequelize models at startup.
- API reference and request examples: see [docs/API_AND_FRONTEND_INTEGRATION.md](docs/API_AND_FRONTEND_INTEGRATION.md).
- Local run instructions: this README.
- Class presentation sequence: see [docs/MONDAY_PRESENTATION.md](docs/MONDAY_PRESENTATION.md).
# fullStack_restaurant_website
