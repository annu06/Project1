# RouteFlow Technical Documentation

## 1. Product scope

RouteFlow centralizes order creation, delivery assignment, lifecycle updates, live GPS visibility, account administration, and operational reporting. Phase 1 is web-only and intentionally excludes payments, invoicing, native mobile applications, and route optimization.

### Roles and permissions

| Capability | Customer | Agent | Administrator |
|---|:---:|:---:|:---:|
| Register and create own orders | Yes | No | Create for customers via API |
| View orders | Own | Assigned | All |
| Assign delivery agent | No | No | Yes |
| Advance order status | No | Assigned | Yes |
| Publish live location | No | Active assigned order | No |
| Manage users and reports | No | No | Yes |

## 2. Architecture

```text
Browser / React SPA
  ├─ HTTPS REST requests ─────────────┐
  └─ authenticated WebSocket ────────┤
                                      ▼
Express API + Socket.IO gateway
  ├─ JWT authentication and RBAC
  ├─ Zod boundary validation
  ├─ order lifecycle service/routes
  └─ Mongoose persistence ───────────► MongoDB
```

The REST API is authoritative: it validates access, changes state, and persists every update. Socket.IO distributes committed updates. This avoids clients treating transient socket messages as durable state.

## 3. Domain model

### User

`name`, unique normalized `email`, bcrypt `passwordHash`, `phone`, `role`, `active`, and timestamps. Password hashes are excluded from normal MongoDB query results and JSON serialization.

### Order

- Human-friendly unique `trackingId`.
- Customer and optional assigned agent references.
- Pickup/drop-off address and latitude/longitude.
- Recipient and package metadata.
- Current status and append-only status log.
- Current GPS reading and bounded location history (latest 500 points).
- Expected and actual delivery times for KPI calculation.

The enforced state machine is:

```text
PLACED → PICKED_UP → IN_TRANSIT → DELIVERED
```

Skipping or reversing states is rejected. An agent can mutate only an order assigned to that agent. Location writes are accepted only while an assigned order is picked up or in transit.

## 4. HTTP API

All protected routes use `Authorization: Bearer <JWT>`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Service health |
| POST | `/api/auth/register` | Public | Customer registration |
| POST | `/api/auth/login` | Public | Create seven-day session |
| GET | `/api/auth/me` | Authenticated | Restore current identity |
| GET | `/api/orders` | Authenticated | Role-filtered order list |
| POST | `/api/orders` | Customer/Admin | Create order |
| GET | `/api/orders/:id` | Authorized participant | Order detail |
| POST | `/api/orders/:id/assign` | Admin | Assign active agent |
| PATCH | `/api/orders/:id/status` | Agent/Admin | Advance one milestone |
| POST | `/api/orders/:id/location` | Agent | Persist GPS reading |
| GET | `/api/users` | Admin | List users; optional role filter |
| PATCH | `/api/users/:id/active` | Admin | Activate/deactivate user |
| GET | `/api/analytics` | Admin | Lifecycle counts and KPIs |

Invalid input returns HTTP 400 with a message and field issues. Authentication, authorization, missing data, and conflicts use 401, 403, 404, and 409 respectively. Unhandled errors return a generic 500 response without leaking internals.

## 5. Real-time protocol

The client includes its JWT in `socket.handshake.auth.token`. After verification, the server joins private `user:<id>` and `role:<role>` rooms. A client requests `order:join` and the server verifies customer/agent/admin access before joining `order:<id>`.

Server events:

- `order:created` — a new order is available.
- `order:assigned` — assignment changed; also sent directly to the agent.
- `order:status` — persisted lifecycle transition.
- `order:location` — latest persisted coordinates and order ID.

On reconnect, the UI fetches REST state again; sockets are used for freshness, not recovery.

## 6. KPI definitions

- **Active deliveries:** orders in `PICKED_UP` or `IN_TRANSIT`.
- **On-time rate:** delivered orders where `deliveredAt <= expectedDeliveryAt`, divided by all delivered orders.
- **Average delivery duration:** average elapsed hours from creation to delivery.
- **Active agents:** agent accounts whose `active` flag is true.
- **Tracking accuracy:** raw browser GPS accuracy is retained per reading; aggregation is a future report extension.
- **Customer satisfaction:** requires a post-delivery rating feature and is reserved for a later phase.

## 7. Security and reliability

Current controls include bcrypt cost 12, signed JWTs, database-backed active-account checks, role and ownership checks, Helmet headers, strict CORS, small JSON payload limits, Zod validation, bounded tracking history, and graceful process shutdown.

Before production, add request rate limiting, refresh-token rotation/revocation, audit log retention, secret management, automated tests, MongoDB replica-set backups, centralized observability, and a Socket.IO Redis adapter for multi-instance delivery. Location data should have an explicit retention policy and customer consent language.

## 8. Scalability path

1. Add geospatial indexes and TTL/archive policies for old location samples.
2. Move high-frequency GPS telemetry to a time-series collection or stream while retaining latest position on the order.
3. Add Redis for socket fan-out, caching, distributed throttling, and background jobs.
4. Separate notifications and analytics into asynchronous consumers.
5. Place static assets behind a CDN and API instances behind a WebSocket-aware load balancer.

## 9. Deployment and operations

The web package builds to `apps/web/dist`; the API builds to `apps/api/dist`. Supply environment values at deployment time, connect the API to managed MongoDB, configure the frontend’s public API/socket URLs at build time, and run the API with `npm start`. Health probes should call `/api/health`. GPS sharing requires HTTPS in production.

## 10. Future phases

Recommended additions are native agent applications with resilient background GPS, push/SMS notifications, proof of delivery, customer ratings, payment/COD reconciliation, AI route optimization, richer SLA analytics, and third-party carrier integrations.
