# EscrowFlow

> Milestone-based escrow payments for Nigeria's service economy.

EscrowFlow protects both clients and service providers during service transactions. A client funds a job upfront into a dedicated virtual account; funds sit in escrow and are released to the provider milestone by milestone, only after the client approves the completed work. If work stalls or is disputed, releases pause until an admin resolves it. This removes the two classic failure modes of informal service payments in Nigeria — clients disappearing after work is done, and providers disappearing after being paid upfront.

Built for the **Nomba Hackathon 2026**, powered by [Nomba](https://nomba.com)'s virtual accounts and transfers API.

**Live app:** [escrowflow-nu.vercel.app](https://escrowflow-nu.vercel.app) · **API:** [escrowflow.onrender.com](https://escrowflow.onrender.com)

---

## Table of Contents

- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## How It Works

1. **Create a job** — a client defines the work, splits it into milestones, and sets an amount per milestone.
2. **Fund escrow** — the client is issued a dedicated Nomba virtual account (with a QR code for easy transfer) and pays the total job amount into it.
3. **Nomba webhook confirms funding** — a signed webhook marks the job `FUNDED`, and a double-entry ledger records the funds as held.
4. **Provider does the work** — and marks each milestone complete, optionally attaching evidence (photos/files uploaded to Cloudinary).
5. **Client approves** — approving a milestone triggers an automatic Nomba transfer to the provider's bank account and writes a `FUNDS_RELEASED` ledger entry.
6. **Auto-release safety net** — if the client doesn't respond, an hourly cron job automatically releases the milestone payout after its timeout window.
7. **Disputes** — either party can raise a dispute, which halts releases until an admin resolves it (approve, refund, or reject).
8. **Refunds** — a cancelled or disputed-against-client job routes held funds back to the client instead of the provider.

## Features

- **Milestone-based escrow** with a full status lifecycle (`CREATED → FUNDING_PENDING → FUNDED → IN_PROGRESS → COMPLETED`, plus `DISPUTED`, `REFUND_PENDING`, `REFUNDED`, `CANCELLED`)
- **Nomba virtual accounts** — a dedicated funding account per job, with QR-code funding in the UI
- **Double-entry ledger engine** — every movement of funds (received, held, released, refunded) is an immutable, appendable ledger row, never mutated
- **Signed webhook receiver** — HMAC-SHA256 verified (hex or base64), idempotent by `eventId`, so replayed or duplicate Nomba events can't double-process a payment
- **Automatic payout on approval**, with an **auto-release cron** as a safety net if the client goes quiet
- **Dispute resolution workflow** for both users and admins
- **Evidence upload** — providers attach proof of completed work via Cloudinary
- **Dual roles** — a single account can act as both client and provider
- **Full client dashboard** — overview, projects, payments/transaction history, disputes, notifications/activity feed, and settings (profile, security, banking, notification preferences)
- **Admin dashboard** — platform-wide stats, job/milestone oversight, dispute resolution
- **Email notifications** for key events (job funded, milestone complete, payout released, disputes)
- **JWT authentication** with bcrypt password hashing
- **Rate limiting, Helmet security headers, Zod validation** at every write endpoint
- **Dark / light mode**, fully responsive UI
- **Global toast notification system** — surfaces network/server failures app-wide instead of dead-ending in a generic error

## Tech Stack

**Frontend**
- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config)
- [React Router v7](https://reactrouter.com)
- [Zustand](https://github.com/pmndrs/zustand) for client state (auth, jobs, toasts, view role)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) for form validation
- [Axios](https://axios-http.com) with request/response interceptors (auth token injection, global error toasts, 401 auto-logout)
- [Lucide](https://lucide.dev) icons, [react-qr-code](https://github.com/rosskhanas/react-qr-code) for funding QR codes

**Backend**
- [Express 5](https://expressjs.com) + TypeScript, running on Node.js
- [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com)
- [JWT](https://github.com/auth0/node-jsonwebtoken) auth + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) password hashing
- [Zod](https://zod.dev) request validation, [Helmet](https://helmetjs.github.io) security headers, [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- [node-cron](https://github.com/node-cron/node-cron) for the hourly auto-release job
- [Nodemailer](https://nodemailer.com) for transactional emails
- [Nomba API](https://nomba.com) for virtual accounts, transfers, and webhooks

## Architecture

```
┌──────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│  React SPA        │ ─────────────────────────▶ │  Express API          │
│  (Vercel)          │ ◀───────────────────────── │  (Render)              │
└──────────────────┘                             └───────────┬──────────┘
                                                                │
                                        ┌───────────────────────┼───────────────────────┐
                                        ▼                       ▼                       ▼
                                ┌──────────────┐      ┌──────────────────┐    ┌──────────────────┐
                                │  MongoDB      │      │  Nomba API        │    │  Cloudinary /     │
                                │  Atlas        │      │  (virtual accts,  │    │  SMTP              │
                                │               │      │  transfers,       │    │  (evidence upload,│
                                │               │      │  webhooks)        │    │  email)           │
                                └──────────────┘      └──────────────────┘    └──────────────────┘
```

The frontend and backend are two independently deployable apps in one repo — a Vite SPA at the repo root, and an Express API in `server/`. They share no code and communicate purely over HTTP.

## Project Structure

```
escrowflow/
├── src/                        # frontend (Vite + React)
│   ├── main.tsx                # entry — wraps <App/> in <BrowserRouter>
│   ├── App.tsx                 # route definitions
│   ├── index.css               # Tailwind config + theme tokens
│   ├── api/
│   │   ├── client.ts           # axios instance, auth header, global error toasts
│   │   └── cloudinary.ts       # evidence upload helper
│   ├── store/                  # zustand stores: auth, jobs, view role, toasts
│   ├── hooks/                  # useTheme, etc.
│   ├── components/
│   │   ├── ui/                 # Logo, ThemeToggle, Toaster
│   │   ├── dashboard/           # dashboard shell pieces
│   │   ├── layout/, sections/  # landing page building blocks
│   │   └── ProtectedRoute.tsx  # route guard
│   └── pages/
│       ├── LoginPage.tsx / SignupPage.tsx
│       ├── dashboard/          # DashboardPage (shell) + DashboardOverview
│       ├── projects/           # ProjectsPage (grid, filters, search)
│       ├── jobs/                # CreateJobPage, JobDetailPage, JobsListPage
│       ├── payments/           # PaymentsPage (stats + transaction history)
│       ├── disputes/           # UserDisputesPage
│       ├── notifications/      # NotificationsPage (activity feed)
│       ├── settings/           # Profile, Security, Banking, Notifications tabs
│       └── admin/               # AdminPage, AdminDisputesPage
│
├── server/                      # backend (Express + MongoDB)
│   └── src/
│       ├── index.ts             # app bootstrap, middleware, route mounting
│       ├── config/db.ts         # mongoose connection
│       ├── middleware/          # auth (JWT), validate (Zod), errorHandler
│       ├── models/               # User, Job, Milestone, LedgerEntry, Transfer, WebhookEvent
│       ├── routes/               # auth, jobs, milestones, payments, admin, profile
│       ├── services/             # nomba.ts, ledger.ts, transfer.ts, email.ts
│       └── jobs/
│           └── autoRelease.ts    # hourly cron — auto-releases overdue milestones
│
└── docs/                        # planning docs, screenshots
```

## Getting Started

Requires **Node.js 20.19+** (or 22.12+), a MongoDB connection string (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas)), and [Nomba](https://nomba.com) sandbox credentials.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, NOMBA_* keys — see below
npm run dev             # starts on http://localhost:3001
```

### 2. Frontend

```bash
# from the repo root
npm install
cp .env.example .env.local   # set VITE_API_URL=http://localhost:3001
npm run dev                   # starts on http://localhost:5173
```

### Other scripts

| Location | Command | Purpose |
|---|---|---|
| root | `npm run build` | type-check + production frontend build |
| root | `npm run lint` | ESLint |
| root | `npm run knip` | find unused files/exports |
| `server/` | `npm run build` | compile TypeScript to `dist/` |
| `server/` | `npm start` | run the compiled server |

## Environment Variables

### Backend (`server/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Random 64+ char secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT` | Server port (default `3001`) |
| `FRONTEND_URL` | Exact origin of the deployed frontend — used for CORS. Must match the browser's origin exactly (scheme + host, no trailing slash) or every API request from the frontend will be rejected by CORS |
| `NOMBA_BASE_URL` | `https://sandbox.nomba.com` for testing, `https://api.nomba.com` in production |
| `NOMBA_CLIENT_ID` / `NOMBA_CLIENT_SECRET` | Nomba API credentials |
| `NOMBA_PARENT_ACCOUNT_ID` / `NOMBA_SUB_ACCOUNT_ID` | Nomba account identifiers used for virtual account creation and transfers |
| `NOMBA_WEBHOOK_SECRET` | Shared secret used to verify the HMAC signature on incoming Nomba webhooks |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM_EMAIL` | Optional — leave blank to disable transactional email |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:3001` or `https://escrowflow.onrender.com`). Vite bakes this in at **build time** — changing it on a hosting provider requires a rebuild, not just a config save |
| `VITE_CLOUDINARY_CLOUD` | Cloudinary cloud name, for milestone evidence uploads |
| `VITE_CLOUDINARY_PRESET` | Cloudinary unsigned upload preset |

## API Reference

Base URL: backend root (no `/api` prefix). All write endpoints validate input with Zod and require `Authorization: Bearer <token>` unless noted.

**Auth** (`/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user (public) |
| POST | `/auth/login` | Log in, returns a JWT (public) |
| GET | `/auth/me` | Current authenticated user |

**Jobs** (`/jobs`)
| Method | Path | Description |
|---|---|---|
| POST | `/jobs` | Create a job with milestones |
| GET | `/jobs` | List jobs for the current user |
| GET | `/jobs/:id` | Job detail, including milestones |
| PATCH | `/jobs/:id/cancel` | Cancel a job (only before funding) |
| PATCH | `/jobs/:id/fund-account` | Provision the Nomba virtual account for funding |

**Milestones** (`/milestones`)
| Method | Path | Description |
|---|---|---|
| PATCH | `/milestones/:id/complete` | Provider marks a milestone complete (with evidence URLs) |
| PATCH | `/milestones/:id/approve` | Client approves — triggers payout via Nomba transfer |
| PATCH | `/milestones/:id/dispute` | Either party raises a dispute |

**Payments** (`/payments`)
| Method | Path | Description |
|---|---|---|
| POST | `/payments/webhook` | Nomba webhook receiver — HMAC-verified, idempotent by `eventId` (public, signature-authenticated instead of JWT) |

**Profile** (`/profile`)
| Method | Path | Description |
|---|---|---|
| GET | `/profile/me` | Current user's full profile |
| PATCH | `/profile/me` | Update name/location/bio/avatar |
| PATCH | `/profile/bank` | Update payout bank account |
| PATCH | `/profile/password` | Change password |
| GET | `/profile/stats` | Dashboard summary stats |
| GET | `/profile/notifications` | Notification preferences |
| PATCH | `/profile/notifications` | Update notification preferences |
| GET | `/profile/transactions` | Transaction/payment history |
| GET | `/profile/disputes` | Disputes involving the current user |
| GET | `/profile/activity` | Activity feed |

**Admin** (`/admin`, requires `ADMIN` role)
| Method | Path | Description |
|---|---|---|
| GET | `/admin/jobs` | All jobs, platform-wide |
| GET | `/admin/milestones` | All milestones, filterable by status |
| PATCH | `/admin/milestones/:id/resolve` | Resolve a dispute (approve payout / refund client) |
| GET | `/admin/stats` | Platform-wide analytics |

**Health**
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check, no auth |

## Data Models

- **User** — name, email, phone, password hash, roles (`CLIENT` / `PROVIDER` / `ADMIN`, an account can hold more than one), bank details, notification preferences
- **Job** — client, provider, total/held/released amounts (in kobo), status, Nomba virtual account details, category, due date
- **Milestone** — belongs to a job, amount, order, status, evidence URLs, `autoReleaseAt` timeout
- **LedgerEntry** — append-only, immutable double-entry record of every fund movement (`FUNDS_RECEIVED`, `FUNDS_HELD`, `FUNDS_RELEASED`, `FUNDS_REFUNDED`) with debit/credit accounts and a reference — enforced immutable at the schema level (updates throw)
- **Transfer** — record of a Nomba payout attempt and its result
- **WebhookEvent** — every received Nomba webhook, keyed by `eventId`, so a redelivered event is a no-op instead of double-processing a payment

All money amounts are stored in **kobo** (the smallest Naira unit) to avoid floating-point rounding errors.

## Deployment

- **Frontend** — deployed on [Vercel](https://vercel.com) at [escrowflow-nu.vercel.app](https://escrowflow-nu.vercel.app). Requires `VITE_API_URL` and the Cloudinary vars set in Vercel's project environment settings, followed by a redeploy (Vite env vars are compile-time, not runtime).
- **Backend** — deployed on [Render](https://render.com) at [escrowflow.onrender.com](https://escrowflow.onrender.com). Requires all backend env vars set in Render's dashboard, plus `FRONTEND_URL` set to the exact Vercel origin so CORS allows the browser to read responses.
- **Database** — [MongoDB Atlas](https://www.mongodb.com/atlas), with Network Access allowing Render's egress (`0.0.0.0/0`, since Render's outbound IPs are dynamic on standard plans).

## Roadmap

- [x] Auth (JWT) with client/provider dual roles
- [x] Job creation with milestone setup
- [x] Nomba virtual account funding + QR code
- [x] Webhook-driven ledger engine
- [x] Milestone approval → automatic payout
- [x] Auto-release timeout safety net
- [x] Dispute raising + admin resolution
- [x] Evidence upload for milestone completion
- [x] Client dashboard (overview, projects, payments, disputes, notifications, settings)
- [x] Admin analytics dashboard
- [x] Email notifications
- [x] Global toast notification system for surfacing failures
- [ ] Automated test suite (unit + integration)
- [ ] In-app real-time notifications (websockets/polling instead of manual refresh)

## Team

Built by **paschal533** for the **Nomba Hackathon 2026**.
