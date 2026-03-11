# BetterSpend — Developer Handoff

This document captures everything a developer needs to understand the current state of the codebase, pick up ongoing work, or onboard quickly without spelunking through every file.

**Last updated:** 2026-03-11
**Phase completed:** Phase 6 — OCR, Catalog, Punchout, Analytics, Redesign
**Live processes:** `betterspend-api` (:4001) + `betterspend-web` (:3100) via pm2

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Infrastructure & Environment](#2-infrastructure--environment)
3. [Database Schema](#3-database-schema)
4. [API Modules](#4-api-modules)
5. [Frontend Pages](#5-frontend-pages)
6. [Auth & Session System](#6-auth--session-system)
7. [Key Architectural Patterns](#7-key-architectural-patterns)
8. [UI Design System](#8-ui-design-system)
9. [Critical Gotchas](#9-critical-gotchas)
10. [Demo Data & Testing](#10-demo-data--testing)
11. [How to Add a New Module](#11-how-to-add-a-new-module)
12. [Remaining Work (Phase 7)](#12-remaining-work-phase-7)

---

## 1. System Overview

BetterSpend is a **single-tenant, self-hosted** Procure-to-Pay system. All data is scoped by `organization_id`. Auth is wired via better-auth — users sign up and log in via the web UI, and Bearer tokens are validated per-request in the session guard.

The full P2P flow:

```
Vendor master → Catalog → Requisition (draft→submit) → Approval chain
  → Purchase Order (draft→issued) → Goods Receipt (GRN)
    → Invoice (OCR upload optional) → 3-Way Match → Finance Approval → Payment
      → GL Export (QuickBooks Online / Xero)
```

Cross-cutting services at every stage: budget checks, audit logging, webhook events.

---

## 2. Infrastructure & Environment

### Docker services (`docker-compose.yml`)

| Service | Container | Port | Credentials |
|---------|-----------|------|-------------|
| PostgreSQL 16 | `betterspend-postgres` | **5433** (host) → 5432 (container) | `betterspend / betterspend` |
| Redis 7 | `betterspend-redis` | 6379 | none |
| MinIO | `betterspend-minio` | 9000 (API), 9001 (console) | `minioadmin / minioadmin` |

> Port 5432 is occupied by a host-level Postgres process. Always use **5433**.

### Environment variables

```
DATABASE_URL=postgresql://betterspend:betterspend@localhost:5433/betterspend
REDIS_URL=redis://localhost:6379
API_PORT=4001                    # NestJS reads API_PORT, not PORT
WEB_URL=http://localhost:3100    # CORS origin in main.ts
PORT=3100                        # Next.js reads PORT
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
BETTER_AUTH_SECRET=<secret>      # Session signing key
ANTHROPIC_API_KEY=<key>          # For Claude Vision OCR
```

> If deploying to a public IP, update `NEXT_PUBLIC_API_URL` and `WEB_URL` accordingly — these are baked into both the API CORS config and the client bundle at build time.

### pm2 Process Management

The server hosts multiple projects. **Only ever target the `betterspend` namespace.**

```bash
pm2 restart betterspend-api    # ✅ safe
pm2 restart betterspend-web    # ✅ safe
pm2 ps --namespace betterspend # ✅ safe

# NEVER: pkill, kill by PID, or restart other namespaces (v1=doody, v2=sr)
```

### Build sequence

Packages must be built before apps (they compile to `dist/`):

```bash
export PNPM_HOME="/home/ubuntu/.local/share/pnpm" && export PATH="$PNPM_HOME:$PATH"
cd packages/db && pnpm run build
cd packages/shared && pnpm run build
cd apps/api && pnpm exec nest build
cd apps/web && pnpm run build
pm2 restart betterspend-api
pm2 restart betterspend-web
```

---

## 3. Database Schema

**~30 tables** across 14 schema files in `packages/db/src/schema/`.

| File | Tables |
|------|--------|
| `organizations.ts` | `organizations`, `departments`, `projects` |
| `users.ts` | `users`, `user_roles` |
| `auth.ts` | `auth_sessions`, `auth_accounts`, `auth_verifications` |
| `vendors.ts` | `vendors`, `catalog_items` |
| `requisitions.ts` | `requisitions`, `requisition_lines` |
| `approvals.ts` | `approval_rules`, `approval_rule_steps`, `approval_requests`, `approval_actions` |
| `purchase-orders.ts` | `purchase_orders`, `po_lines`, `po_versions`, `blanket_releases` |
| `receiving.ts` | `goods_receipts`, `goods_receipt_lines` |
| `invoices.ts` | `invoices`, `invoice_lines`, `match_results` |
| `budgets.ts` | `budgets`, `budget_periods` |
| `documents.ts` | `documents` |
| `audit.ts` | `audit_log` |
| `sequences.ts` | `sequences` |
| `webhooks.ts` | `webhook_endpoints`, `webhook_deliveries` |
| `gl.ts` | `gl_mappings`, `gl_export_jobs` |
| `ocr.ts` | `ocr_jobs` |

### Immutability contracts

These tables are **append-only** — never UPDATE or DELETE:
- `audit_log`
- `approval_actions`
- `match_results` (re-running match creates new rows)
- `po_versions` (PO snapshots before each change order)

### Relations

All Drizzle relational query (`db.query.*`) relations are in `packages/db/src/relations.ts`. If you add a new table with FKs, add its relations there or `with:` queries fail silently.

### Sequences table

Auto-generated numbers (REQ, PO, GRN, INV) use `SELECT ... FOR UPDATE` via `SequenceService`. Each call increments `current_value` and returns `PREFIX-YYYY-NNNN`.

### Demo UUIDs

```
DEMO_ORG_ID   = 00000000-0000-0000-0000-000000000001
DEMO_ADMIN_ID = 00000000-0000-0000-0000-000000000002
```

Controllers fall back to these when no authenticated user is present (demo/dev mode). When a valid session token is sent, `@CurrentOrgId()` and `@CurrentUserId()` resolve from `req.authUser`.

---

## 4. API Modules

Base URL: `/api/v1`. Swagger UI: `/api/docs`. Health check: `/api/health`.

| Module | Prefix | Key features |
|--------|--------|-------------|
| Auth | `/api/auth` | better-auth routes (sign-in, sign-up, sign-out, get-session) |
| Health | `/health` | Liveness check |
| Vendors | `/vendors` | CRUD, punchout toggle, transaction history |
| Users | `/users` | CRUD, activate/deactivate, role management |
| Departments | `/departments` | CRUD |
| Projects | `/projects` | CRUD |
| Catalog | `/catalog-items` | CRUD, search, categories |
| Requisitions | `/requisitions` | CRUD, submit, cancel; triggers approval engine |
| ApprovalRules | `/approval-rules` | CRUD, multi-step chains |
| Approvals | `/approvals` | List pending, approve/reject with comment |
| PurchaseOrders | `/purchase-orders` | CRUD, issue, cancel, change orders, PDF, releases |
| Receiving | `/receiving` | GRN create, confirm, cancel; auto-updates PO status |
| Invoices | `/invoices` | CRUD, 3-way match, approve, bulk-approve, mark-paid |
| Budgets | `/budgets` | CRUD, periods, spend tracking |
| Audit | `/audit` | Read-only audit log with entity/type filters |
| GL | `/gl` | Mappings CRUD, export jobs, retry failed jobs |
| Webhooks | `/webhooks` | Endpoints CRUD, delivery history |
| OCR | `/ocr/jobs` | Upload, extract via Claude Vision, link to invoice |
| Analytics | `/analytics` | KPIs, spend by vendor/dept, monthly, invoice aging, cycle time, budget utilization |
| Reports | `/reports` | CSV downloads (pos, grns, invoices, spend-by-vendor, spend-by-dept, budget-utilization) |
| Search | `/search` | Cross-entity full-text search |
| Punchout | `/punchout` | cXML session/return, catalog page |

### CommonServicesModule

`@Global()` — provides `SequenceService`, `AuditService`, `WebhookEventService` to every module without explicit imports. Lives in `apps/api/src/common/`.

### Approval Engine

`ApprovalEngineService` (`modules/approvals/approval-engine.service.ts`):

1. **`findMatchingRule`** — evaluates JSONB condition trees (`AND`/`OR`, leaf comparisons `>=`, `>`, `<=`, `<`, `==`, `!=`) against entity object. Returns first matching rule ordered by priority.
2. **`initiateApproval`** — auto-approves if no rule matches; else creates `approval_requests` at `currentStep = firstStep.stepOrder`.
3. **`processAction`** — appends to `approval_actions`, advances step or finalizes and updates entity status.

> `approvalRequests` has **no `organizationId`** — `listPending()` returns all globally. Org-scoping requires joining through the approvable entity.

### 3-Way Match

`MatchingService` (`modules/invoices/matching.service.ts`):

Tolerances (constants at top of file):
```typescript
const PRICE_TOLERANCE_PCT = 2;   // 2% price variance
const QTY_TOLERANCE_PCT = 5;     // 5% quantity variance
```

Per-line: match `poLineId` → PO line → sum GRN quantities → compare invoice price/qty. Writes immutable row to `match_results`. Overall status: `full_match` | `partial_match` | `exception`.

### GL Export

`GlExportService` (`modules/gl/gl-export.service.ts`):

- `enqueue(orgId, invoiceId, targetSystem)` — creates a `gl_export_jobs` row with `status: pending`, then calls `setImmediate` to run `processExport` (simulated — real QBO/Xero OAuth not yet integrated)
- `retryJob(jobId, orgId)` — resets job to `pending`, re-runs `processExport`
- Jobs are polled from the GL Export Jobs page; no BullMQ queue yet

### OCR

`OcrService` (`modules/ocr/ocr.service.ts`):

- Accepts base64 image data, calls Claude Vision (`claude-opus-4-5` model) with a structured extraction prompt
- Returns vendor name, invoice number, date, due date, currency, line items, totals
- Job stored in `ocr_jobs` table; linked to invoice via `linkToInvoice`

---

## 5. Frontend Pages

All pages under `apps/web/src/app/`. All are `'use client'` with `useEffect` data fetching via `src/lib/api.ts`.

| Route | Description |
|-------|-------------|
| `/` | Dashboard: KPI cards, recent activity feed, pending items counts |
| `/vendors` | Vendor list |
| `/vendors/new` | Create vendor |
| `/vendors/[id]` | Vendor detail: edit, punchout toggle, transaction history |
| `/catalog` | Catalog items with category/vendor filters, inline create/edit |
| `/catalog/[id]` | Catalog item detail |
| `/requisitions` | REQ list with status filter |
| `/requisitions/new` | Create form with catalog selector and dynamic lines |
| `/requisitions/[id]` | Detail + submit/cancel, approval chain status |
| `/approvals` | Pending approval queue with entity info and links |
| `/approvals/[id]` | Approve/reject with comment |
| `/approval-rules` | Rule builder with multi-step chains |
| `/purchase-orders` | PO list with status filter |
| `/purchase-orders/new` | Create form |
| `/purchase-orders/[id]` | Detail: issue, cancel, change orders, version history, GRN progress, blanket releases, PDF |
| `/receiving` | GRN list |
| `/receiving/new` | GRN form with PO selector, per-line qty inputs |
| `/receiving/[id]` | GRN detail |
| `/invoices` | Invoice list with bulk approve checkboxes |
| `/invoices/new` | Invoice form with optional PO linking |
| `/invoices/[id]` | Detail: match results, approve, mark-paid, GL export trigger |
| `/budgets` | Budget list with utilization bars |
| `/budgets/new` | Create budget |
| `/budgets/[id]` | Budget detail with period management |
| `/gl-mappings` | GL account mapping table |
| `/gl-export-jobs` | Export job history with retry button for failed jobs |
| `/webhooks` | Webhook endpoint management + delivery history |
| `/ocr` | OCR job list and image upload with Claude extraction |
| `/punchout/catalog` | Punchout catalog viewer |
| `/analytics` | Charts: KPIs, spend by vendor/dept, monthly trend, invoice aging |
| `/reports` | CSV export downloads |
| `/audit` | Audit log with entity/type filters |
| `/departments` | Department CRUD |
| `/projects` | Project CRUD |
| `/users` | User management with role assignment |
| `/settings` | Change password |
| `/login` | Sign-in form |
| `/signup` | Account creation |

### `src/lib/api.ts`

Centralizes all API calls. Every `apiFetch` call:
1. Reads `bs_token` from cookies
2. Attaches as `Authorization: Bearer <token>`
3. On 401: clears `bs_token` and redirects to `/login` via `clearAuthAndRedirect()`

Add new API methods here — never call `fetch` directly in pages.

### Next.js 15 route params

Params are `Promise<{ id: string }>` in Next.js 15:
```typescript
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  useEffect(() => { params.then(({ id }) => { ... }); }, [params]);
```

---

## 6. Auth & Session System

### How it works

1. **Sign-in**: `POST /api/auth/sign-in/email` (better-auth route) → returns `{ token, user }` → client stores token as `bs_token` cookie (7-day expiry, `SameSite=Lax`)
2. **Middleware** (`apps/web/src/middleware.ts`): checks for `bs_token` cookie on every non-public route. Redirects to `/login?next=<path>` if absent.
3. **API guard** (`apps/api/src/modules/auth/session.guard.ts`): extracts `Authorization: Bearer <token>` → queries `auth_sessions` table directly by token + expiry check → loads user + roles → attaches to `req.authUser`

### Why the guard queries the DB directly

better-auth's `getSession` API only reads its own `better-auth.session_token` cookie — it does not support Bearer token validation without the bearer plugin. Rather than add complexity, the guard queries `auth_sessions.token` directly (same data, no middleware layer).

### Decorators

```typescript
@CurrentOrgId()   // → req.authUser?.organizationId ?? DEMO_ORG_ID
@CurrentUserId()  // → req.authUser?.id ?? DEMO_ADMIN_ID
```

Both fall back to hardcoded demo UUIDs when no session is present (unauthenticated/dev access still works).

### Demo / dev mode

With no `bs_token` cookie, the session guard passes (no 401) and all controllers operate under the demo org. This is intentional for development.

### `src/lib/auth-client.ts`

Helper functions: `signIn`, `signUp`, `signOut`, `getSession`. Manages the `bs_token` cookie lifecycle.

---

## 7. Key Architectural Patterns

### Drizzle transaction pattern

**Do not** call `db.query.*` inside a `db.transaction()` callback — relational queries use a different connection context and return empty results. Always return the inserted ID from the transaction, then fetch outside:

```typescript
// ✅ Correct
const entityId = await this.db.transaction(async (tx) => {
  const [row] = await tx.insert(table).values({...}).returning();
  await tx.insert(otherTable).values({ parentId: row.id });
  return row.id;
});
return this.findOne(entityId, organizationId);  // relational query outside tx

// ❌ Wrong — returns empty result
const result = await this.db.transaction(async (tx) => {
  const [row] = await tx.insert(table).values({...}).returning();
  const full = await tx.query.table.findFirst({ with: { relations: true } }); // broken
  return full;
});
```

### DB injection

```typescript
constructor(@Inject(DB_TOKEN) private readonly db: Db) {}
```

### Relational vs raw queries

```typescript
// db.query.* for reads with relations
const result = await this.db.query.tableName.findFirst({
  where: (t, { and, eq }) => and(eq(t.orgId, orgId), eq(t.id, id)),
  with: { relatedTable: true },
});

// db.insert/update/delete for mutations
await this.db.update(table).set({ field: value }).where(eq(table.id, id));
```

### Module registration

Every new module must be added to `apps/api/src/app.module.ts` `imports` array. Missing registration causes 404 silently.

### Error handling on the frontend

All pages use `useState<string>` for errors (not `alert()`). Pattern:
```tsx
const [error, setError] = useState('');
// In catch: setError(e.message)
// In JSX: {error && <div style={errorBannerStyle}>{error}<button onClick={() => setError('')}>×</button></div>}
```

---

## 8. UI Design System

### Theme tokens (`apps/web/src/lib/theme.ts`)

All colors, shadows, and font sizes are exported from `theme.ts`:

```typescript
import { COLORS, SHADOWS, FONT } from '../../lib/theme';
```

**Do not hardcode hex values in page files.** Use `COLORS.*` tokens. Key tokens:
- `COLORS.textPrimary` (`#0f172a`) — headings
- `COLORS.textSecondary` (`#475569`) — labels, column headers
- `COLORS.textMuted` (`#94a3b8`) — placeholders, helper text
- `COLORS.cardBg` / `COLORS.tableBorder` — card and table chrome
- `COLORS.accentBlue` / `COLORS.accentBlueDark` — primary action buttons
- `SHADOWS.card` — card box-shadow
- `SHADOWS.focusRing` — input focus ring

### Layout

- Sidebar (`apps/web/src/components/sidebar-nav.tsx`): collapsible, grouped nav items, pending approvals badge, active route highlight
- Topbar (`apps/web/src/components/topbar.tsx`): search bar, user info, sign-out
- Layout (`apps/web/src/app/layout.tsx`): sidebar + topbar shell wrapping all authenticated pages; login/signup bypass the shell

### Mobile

`useMediaQuery` hook (`apps/web/src/lib/use-media-query.ts`) drives responsive behavior. Sidebar collapses to icons-only below `1024px`. Tables have `overflow-x: auto` wrappers.

### Status badge pattern

```tsx
const STATUS_COLORS: Record<string, { background: string; color: string }> = { ... };
<span style={{ ...STATUS_COLORS[status], padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
  {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
</span>
```

---

## 9. Critical Gotchas

### 1. pnpm path
```bash
export PNPM_HOME="/home/ubuntu/.local/share/pnpm" && export PATH="$PNPM_HOME:$PATH"
```

### 2. NestJS reads `API_PORT`, not `PORT`
`main.ts` uses `process.env.API_PORT`. If you see NestJS starting on 3001, this is why.

### 3. Next.js pm2 script path
```js
script: 'node_modules/next/dist/bin/next'  // ✅ Node.js script
// NOT: 'node_modules/.bin/next'            // ❌ bash shebang
```

### 4. `conditions` column is TEXT not JSONB
`approval_rules.conditions` is stored as a TEXT JSON string. The service explicitly `JSON.stringify()` on write and `JSON.parse()` on read.

### 5. `approvalRequests` has no organizationId
No `organization_id` on `approval_requests`. Org-scoping requires joining through the approvable entity.

### 6. `esModuleInterop: true` required
`apps/api/tsconfig.json` must keep `"esModuleInterop": true` for postgres.js CJS/ESM compatibility.

### 7. Shared packages must be built before apps
Running the API without building `@betterspend/db` and `@betterspend/shared` first causes module-not-found errors.

### 8. GL Export is simulated
`processExport` in `gl-export.service.ts` simulates success after a 2-second delay. Real QBO and Xero OAuth flows are not implemented. The schema and job tracking infrastructure is in place.

### 9. Webhook delivery is simulated
`WebhookEventService` emits events and `WebhookDeliveryWorker` attempts HTTP delivery, but retry logic uses `setImmediate` rather than BullMQ. Production would need BullMQ for reliable retry with backoff.

### 10. OCR requires `ANTHROPIC_API_KEY`
OCR jobs call the Claude API. If the key is not set, jobs fail with an auth error. The job status is stored in `ocr_jobs` regardless.

---

## 10. Demo Data & Testing

### Seed (`pnpm db:seed`)

- **Organization:** Acme Corp (`00000000-0000-0000-0000-000000000001`)
- **Users:** Admin (`00000000-0000-0000-0000-000000000002`) + 2 more; also creates a better-auth account for `admin@acmecorp.com` / `password123`
- **Departments:** Engineering, Procurement, Finance
- **Vendors:** Office Supplies Co., Tech Hardware Ltd., Maintenance Services Inc.
- **Catalog items:** Pre-populated with items linked to vendors
- **Sample data:** 1 REQ + 1 PO

### Re-seeding

```bash
docker exec betterspend-postgres psql -U betterspend -d betterspend \
  -c "TRUNCATE organizations CASCADE;"
cd packages/db && pnpm exec tsx src/seed.ts
```

### Login credentials (after seed)

```
Email:    admin@acmecorp.com
Password: password123
```

### Full P2P smoke test

```bash
BASE="http://localhost:4001/api/v1"

# 1. Create approval rule
curl -s -X POST $BASE/approval-rules -H "Content-Type: application/json" -d '{
  "name": "Manager Approval",
  "priority": 100,
  "conditions": {"operator":">=","field":"totalAmount","value":"500"},
  "steps": [{"stepOrder":1,"approverType":"user","approverId":"00000000-0000-0000-0000-000000000002","requiredCount":1}]
}'

# 2. Create and submit requisition
REQ=$(curl -s -X POST $BASE/requisitions ...)
curl -s -X POST $BASE/requisitions/$REQ_ID/submit

# 3. Approve
curl -s -X POST $BASE/approvals/$REQUEST_ID/approve -d '{"comment":"Approved"}'

# 4. Create and issue PO
# 5. Create GRN against PO
# 6. Create invoice → 3-way match runs automatically
# 7. Approve invoice → budget recorded, GL export queued, webhook fired
```

---

## 11. How to Add a New Module

### 1. Schema (`packages/db/src/schema/contracts.ts`)
```typescript
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  // ...
});
```

### 2. Export from index
```typescript
// packages/db/src/schema/index.ts
export * from './contracts';
```

### 3. Add relations (`packages/db/src/relations.ts`)

### 4. Generate and run migration
```bash
pnpm db:generate && pnpm db:migrate
cd packages/db && pnpm run build
```

### 5. Service + Controller + Module — follow any existing module

### 6. Register in `apps/api/src/app.module.ts`

### 7. Rebuild and restart
```bash
cd apps/api && pnpm exec nest build && pm2 restart betterspend-api
```

### 8. Frontend page + sidebar nav entry
Add to `apps/web/src/app/<module>/page.tsx` and `apps/web/src/components/sidebar-nav.tsx`.

---

## 12. Remaining Work (Phase 7)

### Priority 1 — Production Hardening

**Rate limiting:**
- Add `@nestjs/throttler` to the API (`ThrottlerModule.forRoot`)
- Especially important on auth endpoints

**Security headers:**
- Add `helmet()` middleware in `main.ts`

**Structured logging:**
- Replace `console.log` with Pino + correlation IDs
- Log all API requests with method, path, duration, status

**Health check enhancement:**
- Current `/api/health` is a stub; add DB ping, Redis ping, memory stats

**Redis session store:**
- better-auth sessions currently stored in PostgreSQL; move to Redis for faster validation and easier invalidation

**Database connection pooling:**
- Add PgBouncer in front of PostgreSQL for production load

### Priority 2 — Auth Completeness

**Role-based route guards:**
- Add `@Roles('admin')`, `@Roles('finance')` guards to sensitive endpoints
- Currently all authenticated users can call any endpoint

**Organization onboarding:**
- Signup creates a personal demo org; add an onboarding flow to create a real org, invite team members, configure departments

**SSO/SAML:**
- better-auth has OIDC plugin support; wire it for enterprise customers

**Password reset:**
- better-auth has email OTP support; wire a `/forgot-password` flow

### Priority 3 — Real Integrations

**QuickBooks Online:**
- Implement OAuth2 PKCE flow for QBO
- Map BetterSpend invoice → QBO Bill
- `processExport` in `gl-export.service.ts` is the extension point; currently simulated

**Xero:**
- Same pattern via Xero API v2

**BullMQ queues:**
- Replace `setImmediate` in GL export and webhook delivery with proper BullMQ jobs
- Redis infrastructure is already running; just needs queue wiring

**MinIO document storage:**
- OCR currently accepts base64 in the request body; should instead upload to MinIO and pass the storage key
- `documents` table schema is in place

### Priority 4 — UI Polish

**Theme migration:**
- Most pages use `COLORS`/`SHADOWS` tokens; a few older pages still have hardcoded hex values
- Run a grep for `#111827`, `#6b7280`, `#e5e7eb` etc. and replace with tokens

**Loading skeletons:**
- Pages show a plain "Loading…" string; add skeleton placeholder rows

**Toast notifications:**
- Action feedback (approve, submit, save) currently uses inline error/success banners
- A toast system would be cleaner for transient feedback

**Mobile layouts:**
- Sidebar collapses on mobile but page content (especially tables) needs responsive work on small screens

**Dark mode:**
- `COLORS` tokens are all defined; a dark mode toggle would just need a parallel `COLORS_DARK` object and a context switch

### Priority 5 — Data & Reporting

**Analytics charts:**
- Current analytics page shows raw numbers and simple tables
- Add line/bar charts (recharts or chart.js) for monthly spend trend, budget burn rate

**Approval SLA tracking:**
- Track time-in-step per approval request
- Report on average approval cycle time by rule/department

**Invoice aging:**
- API endpoint exists (`/analytics/invoice-aging`)
- Frontend page shows the data but no visual aging chart

**Audit log improvements:**
- Add user name resolution (currently shows raw userId)
- Add diff view for change-order events

---

## Quick Reference

### Status enums

| Entity | Status values |
|--------|--------------|
| Requisition | `draft` → `pending_approval` → `approved` / `rejected` → `converted` / `cancelled` |
| Purchase Order | `draft` → `pending_approval` → `approved` → `issued` → `partially_received` → `received` → `closed` / `cancelled` |
| GRN | `draft` → `confirmed` / `cancelled` |
| Invoice | `pending_match` → `matched` / `partial_match` / `exception` → `approved` → `paid` |
| Approval Request | `pending` → `approved` / `rejected` |
| GL Export Job | `pending` → `processing` → `success` / `failed` |
| OCR Job | `pending` → `processing` → `completed` / `failed` |

### Numeric precision

All monetary amounts: `NUMERIC(14, 2)`. All quantities: `NUMERIC(10, 2)`. Stored as strings in JavaScript; always `parseFloat()` before arithmetic.

### Webhook events emitted

`invoice.matched`, `invoice.exception`, `invoice.approved`, `invoice.paid`, `po.issued`, `po.cancelled`, `grn.created`, `requisition.submitted`, `requisition.approved`, `requisition.rejected`
