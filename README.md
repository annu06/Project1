# RouteFlow — Real-Time Delivery Tracking

RouteFlow is a production-oriented Phase 1 web platform for customers, delivery agents, and logistics administrators. It manages the full delivery lifecycle from order placement and assignment through GPS tracking and delivery confirmation.

## Included capabilities

- **Customers:** register, create orders, view history, open a live map, and follow milestone updates.
- **Delivery agents:** view assigned work, advance valid status transitions, and share browser GPS continuously.
- **Administrators:** monitor all orders, assign agents, manage account availability, and view service KPIs.
- **Real-time layer:** authenticated Socket.IO rooms distribute assignment, status, and location events.
- **Operations:** responsive interface, MongoDB persistence, JWT/RBAC security, structured API validation, demo seed, and Docker-based local database.

## Project structure

```text
apps/
  api/                 Express + Mongoose + Socket.IO service
    src/models/        User and delivery domain models
    src/routes/        Auth, order, people, and analytics APIs
    src/middleware/    Authentication and error handling
  web/                 React + Vite single-page application
    src/components/    Shared shell, order cards, status, map
    src/pages/         Customer, agent, and admin experiences
docs/
  TECHNICAL_DOCUMENTATION.md
compose.yaml           Local MongoDB service
```

## Quick start (Windows PowerShell)

Prerequisites: Node.js 20+, npm 10+, and either Docker Desktop or MongoDB 7.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
npm install
docker compose up -d
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API is available at `http://localhost:4000`; `GET /api/health` provides a health check.

### Demo accounts

All seeded accounts use `Password123!`.

| Role | Email |
|---|---|
| Customer | `customer@routeflow.dev` |
| Delivery agent | `agent@routeflow.dev` |
| Second agent | `agent2@routeflow.dev` |
| Administrator | `admin@routeflow.dev` |

The seed command resets orders and replaces only these four demo accounts. Do not run it against production data.

## Commands

- `npm run dev` — run API and web development processes.
- `npm run build` — compile both applications for production.
- `npm run typecheck` — strict TypeScript verification.
- `npm run seed` — load role accounts and lifecycle sample data.
- `npm start` — start the compiled API.

## Production notes

1. Set a strong, unique `JWT_SECRET`; never use the development fallback.
2. Use a managed MongoDB replica set, TLS, backups, network allowlists, and least-privilege credentials.
3. Build the web app and serve `apps/web/dist` from a CDN or static host. Set `VITE_API_URL` and `VITE_SOCKET_URL` before building.
4. Deploy the API to a host supporting persistent WebSocket connections and configure `CLIENT_URL` to the exact frontend origin.
5. For horizontal API scaling, add a Socket.IO Redis adapter and use a shared rate limiter/session revocation store.
6. Serve all production traffic over HTTPS. Browser GPS is only available on secure origins (except localhost).

The map uses OpenStreetMap tiles through Leaflet so the project works without a paid API key. The `TrackingMap` component can be replaced with Google Maps when a billing-enabled key is available.
