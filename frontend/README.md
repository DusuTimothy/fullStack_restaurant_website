# Restaurant System Frontend

The frontend is a React application built with Vite. It provides the public menu, customer signup and login, cart and checkout, order tracking, and administrator menu management.

## Requirements

- Node.js 20.19+ or 22.12+ and npm
- The backend API running locally, unless configured to use another API URL

## Development

From this directory, install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

The frontend is normally available at `http://localhost:5173`. The Vite development server is configured to proxy relative `/api` and `/uploads` requests to `http://localhost:5000`.

The Axios client defaults to `http://localhost:5000/api`. To use a different backend, set either variable in a frontend `.env` file:

```env
VITE_BACKEND_URL=http://localhost:5000
# Or set the API URL directly:
# VITE_API_URL=http://localhost:5000/api
```

Only public frontend configuration belongs in `VITE_*` variables; never put database credentials or server secrets in frontend environment variables.

## Production build

```bash
npm run build
npm run preview
```

The build output is written to `dist/`. It contains generated production assets; edit files under `src/` and rebuild rather than editing `dist/` directly.

## Application structure

- `src/pages/` contains route-level screens.
- `src/components/` contains reusable interface elements.
- `src/context/` provides shared authentication and cart state.
- `src/api/axiosClient.js` configures API requests, JWT handling, and uploaded-image URLs.

For API endpoints and request/response examples, see [`../docs/API_AND_FRONTEND_INTEGRATION.md`](../docs/API_AND_FRONTEND_INTEGRATION.md).
