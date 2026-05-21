# rentflow-pro — Frontend Documentation

> **Project role:** The landlord and tenant facing web application for the MyTenant rent management platform.
> Built as a TanStack Start / Vite SPA that communicates exclusively with `mytenant-backend` over a REST API secured with Firebase Auth JWTs.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Authentication System](#5-authentication-system)
6. [Routing & Pages](#6-routing--pages)
7. [API Layer](#7-api-layer)
8. [State Management](#8-state-management)
9. [UI Component Library](#9-ui-component-library)
10. [Receipts Module (Detailed)](#10-receipts-module-detailed)
11. [Environment Variables](#11-environment-variables)
12. [Running Locally](#12-running-locally)
13. [Build & Deployment](#13-build--deployment)

---

## 1. Project Overview

`rentflow-pro` is a **TypeScript React SPA** that provides two distinct dashboards:

| Role | Entry point | Key capabilities |
|------|-------------|-----------------|
| **Landlord** | `/landlord/*` | Manage properties, invite & manage tenants, review payment proofs, generate receipts (auto and manual), view notifications |
| **Tenant** | `/tenant/*` | View dashboard, upload rent proof images, track payments, view & download receipts, view notifications |

The application is **file-route based** — every route maps to a single `.tsx` file under `src/routes/`. There is no Redux or Context API for server state; all remote data is managed with **TanStack Query**. Global client state (auth tokens) is managed with **Zustand**.

---

## 2. Technology Stack

### Core Runtime

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | UI rendering library |
| **TypeScript** | 5.8.3 | Static typing across the entire codebase |
| **Vite** | 7.3.1 | Development server, Hot Module Replacement (HMR), and production bundler |

### Routing

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TanStack Router** | 1.168.25 | File-based, type-safe client-side routing with full TypeScript inference for route params and search params |
| **TanStack Start** | 1.167.50 | TanStack's full-stack companion that provides SSR capabilities, server functions, and Vite integration on top of TanStack Router |
| **@tanstack/router-plugin** | 1.167.28 | Vite plugin that auto-generates `src/routeTree.gen.ts` from the `src/routes/` directory — no manual route registration needed |

### Data Fetching & Server State

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TanStack Query (React Query)** | 5.83.0 | Declarative server-state management: caching, background refetching, loading/error states, optimistic updates, query invalidation |
| **Axios** | 1.16.0 | HTTP client used inside every API module; configured with a shared base URL, request interceptors (auth token injection) and response interceptors (silent JWT refresh on 401) |

### Forms & Validation

| Technology | Version | Purpose |
|-----------|---------|---------|
| **react-hook-form** | 7.71.2 | Performant, uncontrolled form management with a minimal re-render footprint. Used for every form in the app (invite tenant, create manual receipt, etc.) |
| **@hookform/resolvers** | 5.2.2 | Bridges react-hook-form to external validation libraries |
| **Zod** | 3.24.2 | Schema-first runtime validation. Every form defines a `z.object()` schema; `zodResolver` links it to react-hook-form so validation errors are fully type-safe |

### Styling

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TailwindCSS** | 4.2.1 | Utility-first CSS framework. All component styling is written with Tailwind utility classes |
| **@tailwindcss/vite** | 4.2.1 | Vite plugin for TailwindCSS v4 (replaces the old PostCSS plugin approach) |
| **tw-animate-css** | 1.3.4 | Drop-in CSS animation utilities (fade-in, slide-up, etc.) integrated with Tailwind |
| **tailwind-merge** | 3.0.0 | Intelligently merges conflicting Tailwind class strings (used inside `cn()` utility) |
| **clsx** | 2.1.1 | Lightweight conditional class string construction (also used inside `cn()`) |
| **class-variance-authority (CVA)** | 0.7.1 | Manages component variant props (e.g., `variant="outline"` on `<Button>`) with full TypeScript inference |

### UI Component Library

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Radix UI** (multiple packages) | Various | Headless, accessible primitive components (Dialog, Select, DropdownMenu, AlertDialog, Accordion, Popover, Tabs, Tooltip, etc.). Every component in `src/components/ui/` wraps a Radix primitive |
| **Lucide React** | 0.575.0 | SVG icon library — provides all icons used throughout the app (Receipt, Download, ExternalLink, Loader2, etc.) |
| **Sonner** | 2.0.7 | Toast/notification system used for success and error feedback (`toast.success()`, `toast.error()`) |
| **Framer Motion** | 12.38.0 | Animation library used for page transitions and micro-animations |
| **Recharts** | 2.15.4 | React charting library used on the landlord dashboard for financial analytics |
| **Embla Carousel** | 8.6.0 | Lightweight carousel/slider component |
| **Vaul** | 1.1.2 | Drawer component (mobile bottom sheet) |
| **cmdk** | 1.1.1 | Command palette component |
| **react-day-picker** | 9.14.0 | Date picker component used in payment forms |
| **react-resizable-panels** | 4.6.5 | Resizable panel layout component |
| **input-otp** | 1.4.2 | OTP/PIN input component |
| **date-fns** | 4.1.0 | Date formatting utility library |

### Client-Side State

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Zustand** | 5.0.13 | Minimal, hook-based global state store. Used exclusively for the `authStore` (access token, user profile, logout action) |

### Developer Tooling

| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 9.32.0 | JavaScript/TypeScript linter |
| **eslint-plugin-react-hooks** | 5.2.0 | Enforces Rules of Hooks |
| **Prettier** | 3.7.3 | Code formatter |
| **@types/react** | 19.2.0 | TypeScript declarations for React |

### Cloud & Deployment

| Technology | Version | Purpose |
|-----------|---------|---------|
| **@cloudflare/vite-plugin** | 1.25.5 | Enables Cloudflare Workers/Pages deployment from the Vite build pipeline |
| **wrangler** | (config in `wrangler.jsonc`) | Cloudflare Workers CLI; the `wrangler.jsonc` file configures the Pages deployment target |

---

## 3. Project Structure

```
rentflow-pro/
├── src/
│   ├── api/                       # API client layer
│   │   ├── axiosClient.ts         # Axios instance: base URL, auth interceptor, silent refresh
│   │   ├── auth.api.ts            # login, signup, refresh, Google auth, forgot/reset password
│   │   ├── properties.api.ts      # CRUD for landlord properties
│   │   ├── tenants.api.ts         # list, invite, remove tenants; tenant self-lookup
│   │   ├── payments.api.ts        # submit proof, list payments, approve/reject
│   │   ├── receipts.api.ts        # list, get, openReceipt, downloadReceipt, createManual
│   │   ├── notifications.api.ts   # list notifications, mark read
│   │   └── index.ts               # barrel export for all api modules and types
│   ├── components/
│   │   ├── ui/                    # shadcn/ui-style component wrappers around Radix UI
│   │   ├── common/                # shared components used across multiple routes
│   │   └── layout/                # layout shells (sidebar, top nav, breadcrumbs)
│   ├── hooks/                     # custom React hooks
│   ├── lib/
│   │   └── utils.ts               # cn() helper (clsx + tailwind-merge)
│   ├── routes/
│   │   ├── __root.tsx             # Root layout: QueryClientProvider, Toaster, RouterDevtools
│   │   ├── index.tsx              # Landing / marketing page (public)
│   │   ├── login.tsx              # Login page
│   │   ├── signup.tsx             # Sign-up page
│   │   ├── invite.tsx             # Tenant invite acceptance page
│   │   ├── forgot-password.tsx    # Password reset request page
│   │   ├── _landlord.tsx          # Landlord layout wrapper (sidebar + auth guard)
│   │   ├── _landlord.landlord.dashboard.tsx
│   │   ├── _landlord.landlord.properties.tsx
│   │   ├── _landlord.landlord.tenants.tsx
│   │   ├── _landlord.landlord.payments.review.tsx
│   │   ├── _landlord.landlord.receipts.tsx  ← includes manual receipt dialog
│   │   ├── _landlord.landlord.notifications.tsx
│   │   ├── _tenant.tsx            # Tenant layout wrapper (sidebar + auth guard)
│   │   ├── _tenant.tenant.dashboard.tsx
│   │   ├── _tenant.tenant.payments.tsx
│   │   ├── _tenant.tenant.upload.tsx
│   │   ├── _tenant.tenant.receipts.tsx
│   │   └── _tenant.tenant.notifications.tsx
│   ├── store/
│   │   └── authStore.ts           # Zustand auth store (accessToken, user, logout)
│   ├── utils/
│   │   └── format.ts              # formatCurrency(), formatDate() helpers
│   ├── routeTree.gen.ts           # Auto-generated by @tanstack/router-plugin — do not edit
│   ├── router.tsx                 # createRouter() call that consumes routeTree.gen.ts
│   ├── server.ts                  # TanStack Start server entry (SSR handler)
│   ├── start.ts                   # Client entry point
│   └── styles.css                 # Global CSS + Tailwind v4 @import
├── public/                        # Static assets (favicon, og-image, etc.)
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Vite config: TanStack Router plugin, Cloudflare plugin
└── wrangler.jsonc                 # Cloudflare Pages / Workers deployment config
```

---

## 4. Architecture & Data Flow

```
┌─────────────────────────────────────────────────┐
│               Browser (rentflow-pro)             │
│                                                  │
│  TanStack Router  →  Route Component             │
│       ↓                    ↓                     │
│  TanStack Query  ←→  API Module (axiosClient)   │
│       ↓                                          │
│  Zustand authStore  (access token)               │
└────────────────────┬────────────────────────────┘
                     │  HTTPS (Bearer JWT)
                     ▼
┌────────────────────────────────────────────────┐
│          mytenant-backend (Flask)              │
│  /auth  /tenants  /payments  /receipts  ...    │
└────────────────────────────────────────────────┘
                     │
                     ▼
              Firebase Firestore + Cloudinary
```

**Request lifecycle:**
1. User triggers an action (button click, form submit).
2. A TanStack Query mutation or query function calls the relevant `*Api` method.
3. The `axiosClient` request interceptor reads `useAuthStore.getState().accessToken` and injects it as `Authorization: Bearer <token>`.
4. If the backend returns `401`, the response interceptor silently calls `/auth/refresh` using the httpOnly `refresh_token` cookie, stores the new token via `authStore.setAccessToken()`, and retries the original request — completely transparent to the UI.
5. The response is cached by TanStack Query. Mutations call `queryClient.invalidateQueries()` so affected lists refresh automatically.

---

## 5. Authentication System

### Token Strategy

| Token | Storage | Lifetime | Purpose |
|-------|---------|---------|---------|
| `accessToken` | Zustand in-memory only (never localStorage) | Short (minutes) | Sent as `Authorization: Bearer` header on every API call |
| `refresh_token` | httpOnly cookie (set by backend) | Long (days/weeks) | Used by `/auth/refresh` to issue new access tokens without requiring re-login |

### Silent Refresh

Located in `src/api/axiosClient.ts`. When any request returns 401:
- Auth endpoints (`/auth/login`, `/auth/refresh`, etc.) are excluded — a 401 there means wrong credentials, not an expired session.
- For all other endpoints, the interceptor queues the failed request, calls `POST /auth/refresh`, updates the Zustand store with the new token, then replays all queued requests.
- If refresh also fails, `authStore.logout()` is called to redirect the user to the login page.

### Role-Based Routing

Each role has its own layout route (`_landlord.tsx`, `_tenant.tsx`). These layout components read the user's role from `authStore` and redirect to the appropriate path if the role does not match.

---

## 6. Routing & Pages

TanStack Router uses **file-based routing**. Files in `src/routes/` are scanned by the `@tanstack/router-plugin` Vite plugin, which auto-generates `routeTree.gen.ts`.

### File naming convention

| File name pattern | Meaning |
|-------------------|---------|
| `_landlord.tsx` | Layout route (underscore prefix = layout wrapper, not a URL segment) |
| `_landlord.landlord.dashboard.tsx` | Child route of `_landlord` layout at `/landlord/dashboard` |
| `index.tsx` | Index route at `/` |
| `login.tsx` | Route at `/login` |

### Route inventory

| File | URL | Access |
|------|-----|--------|
| `index.tsx` | `/` | Public (marketing/landing) |
| `login.tsx` | `/login` | Public |
| `signup.tsx` | `/signup` | Public |
| `invite.tsx` | `/invite` | Public (token in query params) |
| `forgot-password.tsx` | `/forgot-password` | Public |
| `_landlord.landlord.dashboard.tsx` | `/landlord/dashboard` | Landlord only |
| `_landlord.landlord.properties.tsx` | `/landlord/properties` | Landlord only |
| `_landlord.landlord.tenants.tsx` | `/landlord/tenants` | Landlord only |
| `_landlord.landlord.payments.review.tsx` | `/landlord/payments/review` | Landlord only |
| `_landlord.landlord.receipts.tsx` | `/landlord/receipts` | Landlord only |
| `_landlord.landlord.notifications.tsx` | `/landlord/notifications` | Landlord only |
| `_tenant.tenant.dashboard.tsx` | `/tenant/dashboard` | Tenant only |
| `_tenant.tenant.payments.tsx` | `/tenant/payments` | Tenant only |
| `_tenant.tenant.upload.tsx` | `/tenant/upload` | Tenant only |
| `_tenant.tenant.receipts.tsx` | `/tenant/receipts` | Tenant only |
| `_tenant.tenant.notifications.tsx` | `/tenant/notifications` | Tenant only |

---

## 7. API Layer

All API modules live in `src/api/` and are barrel-exported from `src/api/index.ts`.

### `axiosClient.ts`

Single Axios instance used by every API module.

- **`baseURL`**: `import.meta.env.VITE_API_URL ?? "/api"`. In development, Vite proxies `/api/*` → `http://localhost:5000/*` (configured in `vite.config.ts`).
- **`withCredentials: true`**: Required for the browser to send the httpOnly `refresh_token` cookie on `/auth/refresh` calls.
- **Request interceptor**: Reads `accessToken` from Zustand and injects it as `Authorization: Bearer <token>`.
- **Response interceptor**: Handles `401` responses with silent JWT refresh logic (see §5).

### `receipts.api.ts` — Key methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| `list(params?)` | `GET /receipts` | Paginated list of receipts for the current user (landlord sees all, tenant sees their own) |
| `get(id)` | `GET /receipts/:id` | Fetch a single receipt by ID |
| `openReceipt(id)` | `GET /receipts/:id/download` then `GET /receipts/:id/preview` | Open receipt in a new browser tab. **Critical:** opens `about:blank` synchronously before any `await` to avoid popup-blocker; then navigates the tab to the PDF URL or a Blob URL of the rendered HTML |
| `downloadReceipt(id)` | `GET /receipts/:id/download` | If a Cloudinary PDF URL exists, downloads it as a file via a hidden `<a download>` anchor. Falls back to `openReceipt()` if no PDF is available |
| `createManual(body)` | `POST /receipts/manual` | Landlord creates a manual receipt for a cash payment (no proof image required) |

#### Popup-blocker fix (important)

Browsers block `window.open()` that is not called synchronously within a user-gesture handler. When called inside an `async` function after an `await`, the call stack no longer originates from the click event, so Chrome/Firefox/Safari treat it as a popup and block it.

**Solution:** `openReceipt()` calls `window.open("about:blank", "_blank", "noreferrer")` **before** any `await`. The tab is opened immediately (synchronous, inside the click handler). After the async fetch completes, we navigate the already-open tab via `newTab.location.href = url` instead of calling `window.open()` again.

---

## 8. State Management

### TanStack Query (server state)

Every data fetch is a `useQuery` call with a structured `queryKey`:

```typescript
// Example: landlord receipts list
const receiptsQ = useQuery({
  queryKey: ["receipts"],
  queryFn: () => receiptsApi.list({ limit: 100 }),
});
```

Mutations use `useMutation` and invalidate the relevant query key on success:

```typescript
const manualMutation = useMutation({
  mutationFn: (body: ManualReceiptBody) => receiptsApi.createManual(body),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["receipts"] });
    toast.success("Receipt created.");
  },
});
```

### Zustand (client state)

`src/store/authStore.ts` is the only Zustand store. It holds:

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | `string \| null` | Current Firebase-issued access token |
| `user` | `{ sub, email, role, ... } \| null` | Decoded token payload |
| `setAccessToken(token)` | function | Updates token and decodes payload |
| `logout()` | function | Clears token and user, redirects to `/login` |

---

## 9. UI Component Library

All UI components in `src/components/ui/` follow the **shadcn/ui** pattern:

- Each file wraps a **Radix UI** headless primitive.
- Styling is applied via **TailwindCSS** utility classes.
- Variants are defined with **class-variance-authority (CVA)**.
- The `cn()` helper from `src/lib/utils.ts` merges class strings safely.

Key components:

| Component | Radix primitive | Usage |
|-----------|----------------|-------|
| `Button` | `@radix-ui/react-slot` | Primary action buttons across the app |
| `Dialog` | `@radix-ui/react-dialog` | Modal dialogs (Manual Receipt, Invite Tenant, Delete Confirm) |
| `Select` | `@radix-ui/react-select` | Dropdown selects (payment method, tenant selector) |
| `Badge` | none | Status pills (Manual / Auto receipt badges, active/inactive tenant status) |
| `Input` | none | Text inputs |
| `Textarea` | none | Multi-line text inputs |
| `Label` | `@radix-ui/react-label` | Form field labels |
| `AlertDialog` | `@radix-ui/react-alert-dialog` | Destructive action confirmation (remove tenant) |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` | Action menus (tenant card options) |

---

## 10. Receipts Module (Detailed)

### Landlord Receipts Page — `_landlord.landlord.receipts.tsx`

**Features:**

1. **Receipt list** — paginated list of all receipts for the landlord's tenants with receipt number, amount, date, and a `Manual`/`Auto` badge.
2. **View (ExternalLink button)** — calls `receiptsApi.openReceipt(id)`, which opens the receipt in a new tab as a PDF (if Cloudinary URL exists) or as a rendered HTML page (fallback).
3. **Download (Download button)** — calls `receiptsApi.downloadReceipt(id)`, which triggers a browser file download of the PDF. If no PDF exists, falls back to opening the HTML preview.
4. **Create Manual Receipt dialog** — Opened by the "Create Manual Receipt" button in the header (or the CTA on the empty state). Form fields:
   - **Tenant** (required): dropdown populated by `tenantsApi.list({ status: "active" })`. Shows `fullName (email)` — names are enriched by the backend from the user's Firestore profile.
   - **Amount Paid** (required): numeric with `step="0.01"`.
   - **Payment Date** (required): date picker, defaults to today.
   - **Payment Method** (required): `cash | mobile_money | bank_transfer | other`.
   - **Reference Number** (optional): up to 200 characters.
   - **Notes** (optional): up to 1000 characters.
   - On success: invalidates the `["receipts"]` query, shows a success toast with the new receipt number, closes and resets the form.

**Local state:**

| State | Type | Purpose |
|-------|------|---------|
| `search` | `string` | Filters receipts by receipt number |
| `active` | `{ id, action } \| null` | Tracks which receipt has an in-progress view/download action (prevents double-click, shows spinner on the correct button) |
| `showManual` | `boolean` | Controls dialog visibility |

### Tenant Receipts Page — `_tenant.tenant.receipts.tsx`

**Features:**

1. **Receipt list** — shows all receipts issued to the tenant (both auto-generated and manual).
2. **View** — same `openReceipt()` logic as the landlord page.
3. **Download** — same `downloadReceipt()` logic.

No manual receipt creation is available to tenants — that workflow is landlord-only.

---

## 11. Environment Variables

Create a `.env` file in the `rentflow-pro/` directory:

```env
# Backend API base URL.
# In dev, Vite's proxy rewrites /api/* → http://localhost:5000/*,
# so you can leave this unset or set it to /api.
# In production, set it to your deployed Flask backend URL.
VITE_API_URL=http://localhost:5000
```

---

## 12. Running Locally

**Prerequisites:**
- Node.js 18+ (Node 20 LTS recommended)
- `mytenant-backend` running on `http://localhost:5000`

```bash
# Install dependencies (uses npm)
cd rentflow-pro
npm install

# Start the Vite dev server (HMR enabled)
npm run dev

# The app will be available at http://localhost:3000
# (or http://localhost:8080 depending on TanStack Start config)
```

**Linting & formatting:**
```bash
npm run lint       # ESLint
npm run format     # Prettier
```

---

## 13. Build & Deployment

```bash
# Production build (output in dist/)
npm run build

# Preview the production build locally
npm run preview
```

The app is configured for **Cloudflare Pages** via `wrangler.jsonc`. The `@cloudflare/vite-plugin` handles the build pipeline transformation needed for Cloudflare Workers runtime.

For other hosting targets (Vercel, Netlify, self-hosted Nginx), remove the `@cloudflare/vite-plugin` from `vite.config.ts` and build as a standard static SPA.
