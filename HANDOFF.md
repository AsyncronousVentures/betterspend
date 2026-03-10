# BetterSpend — Developer Handoff

This document captures everything a developer needs to understand the current state of the codebase, pick up ongoing work, or onboard quickly without spelunking through every file.

**Last updated:** 2026-03-10
**Phase completed:** Phase 4 — Receiving, Invoicing, 3-Way Match
**Live processes:** `betterspend-api` (:4001) + `betterspend-web` (:3100) via pm2

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Infrastructure & Environment](#2-infrastructure--environment)
3. [Database Schema](#3-database-schema)
4. [API Modules](#4-api-modules)
5. [Frontend Pages](#5-frontend-pages)
6. [Key Architectural Patterns](#6-key-architectural-patterns)
7. [Critical Gotchas](#7-critical-gotchas)
8. [Demo Data & Testing](#8-demo-data--testing)
9. [How to Add a New Module](#9-how-to-add-a-new-module)
10. [Remaining Work (Phases 5–7)](#10-remaining-work-phases-57)

---

## 1. System Overview

BetterSpend is a **single-tenant, self-hosted** Procure-to-Pay system. There is no multi-tenancy logic — all data is scoped by `organization_id` in every table, hardcoded to the demo org UUID until better-auth is wired in Phase 7.

The full flow is:

```
Vendor master → Requisition (draft→submit) → Approval chain
  → Purchase Order (draft→issued) → Goods Receipt (GRN)
    → Invoice → 3-Way Match → Finance Approval → Payment
```

Budget checks and audit logging run cross-cutting at each stage.

---

## 2. Infrastructure & Environment

### Docker services (`docker-compose.yml`)

| Service | Container name | Port | Credentials |
|---------|---------------|------|-------------|
| PostgreSQL 16 | `betterspend-postgres` | **5433** (host) → 5432 (container) | `betterspend / betterspend` |
| Redis 7 | `betterspend-redis` | 6379 | none |
| MinIO | `betterspend-minio` | 9000 (API), 9001 (console) | `minioadmin / minioadmin` |

> Port 5432 is occupied by a host-level Postgres process on this machine. Always use **5433**.

### Environment variables (`.env` / pm2 ecosystem)

```
DATABASE_URL=postgresql://betterspend:betterspend@localhost:5433/betterspend
REDIS_URL=redis://localhost:6379
API_PORT=4001          # NestJS reads API_PORT, not PORT
WEB_URL=http://localhost:3100   # CORS origin in main.ts
PORT=3100              # Next.js reads PORT
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
```

### pm2 Process Management

The server hosts multiple projects. **Only ever target the `betterspend` namespace.**

```bash
pm2 restart betterspend-api    # ✅ safe
pm2 restart betterspend-web    # ✅ safe
pm2 ps --namespace betterspend # ✅ safe

# NEVER: pkill, kill by PID, or restart other namespaces (v1=doody, v2=sr)
```

Ecosystem file: `ecosystem.config.js` at project root.
Logs: `~/.pm2/logs/betterspend-*.log`

### Build sequence

Packages must be built before apps (they compile to `dist/` which apps import):

```bash
cd packages/db && pnpm run build
cd packages/shared && pnpm run build
cd apps/api && pnpm exec nest build
cd apps/web && pnpm run build
pm2 restart betterspend-api
pm2 restart betterspend-web
```

---

## 3. Database Schema

**29 tables** across 13 schema files in `packages/db/src/schema/`.

### Schema files and their tables

| File | Tables |
|------|--------|
| `organizations.ts` | `organizations`, `departments`, `projects` |
| `users.ts` | `users`, `user_roles` |
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

### Immutability contracts

Two tables are **append-only** — no UPDATE or DELETE should ever touch them:

- `audit_log` — every mutation in the system is logged here
- `approval_actions` — every approve/reject/delegate action is logged here
- `match_results` — 3-way match outcomes per invoice line (re-run creates new rows)
- `po_versions` — PO snapshots before each change order

### Relations

All Drizzle relational query (`db.query.*`) relations are defined in `packages/db/src/relations.ts`. If you add a new table with FKs, add its relations there or `with:` queries will fail silently.

### Sequences table

Number generation (REQ, PO, GRN, INV) uses `SELECT ... FOR UPDATE` via `SequenceService`:

```
entity_type     | current_value | prefix
----------------|---------------|-------
requisition     | 1             | REQ
purchase_order  | 1             | PO
goods_receipt   | 1             | GRN
invoice         | 1             | INV
```

Each call increments `current_value` and returns `PREFIX-YYYY-NNNN`. The `FOR UPDATE` lock prevents gaps under concurrent load.

### Demo UUIDs (hardcoded in all controllers until Phase 7)

```
DEMO_ORG_ID   = 00000000-0000-0000-0000-000000000001
DEMO_ADMIN_ID = 00000000-0000-0000-0000-000000000002
```

---

## 4. API Modules

Base URL: `/api/v1`. Swagger UI: `/api/docs`.

### Module map

| Module | Controller prefix | Service file | Key dependencies |
|--------|------------------|--------------|-----------------|
| Vendors | `/vendors` | `vendors.service.ts` | DB |
| Users | `/users` | `users.service.ts` | DB |
| Requisitions | `/requisitions` | `requisitions.service.ts` | DB, SequenceService, ApprovalEngineService |
| PurchaseOrders | `/purchase-orders` | `purchase-orders.service.ts` | DB, SequenceService, PdfService |
| ApprovalRules | `/approval-rules` | `approval-rules.service.ts` | DB |
| Approvals | `/approvals` | `approval-engine.service.ts` | DB |
| Budgets | `/budgets` | `budgets.service.ts` | DB |
| Receiving | `/receiving` | `receiving.service.ts` | DB, SequenceService |
| Invoices | `/invoices` | `invoices.service.ts` | DB, SequenceService, MatchingService |

### CommonServicesModule

`@Global()` — provides `SequenceService` to every module without explicit imports. Lives in `apps/api/src/common/services/`.

### Approval Engine deep dive

`ApprovalEngineService` (`modules/approvals/approval-engine.service.ts`):

1. **`findMatchingRule(orgId, entityType, entity)`** — fetches all active rules ordered by priority, evaluates JSONB condition trees against the entity object, returns first match.
2. **`evaluateCondition(condition, entity)`** — recursive: handles `AND`/`OR` compound nodes and leaf comparisons (`>=`, `>`, `<=`, `<`, `==`/`eq`, `!=`/`neq`). Field values are `parseFloat()`-coerced for numeric comparisons.
3. **`initiateApproval(orgId, entityType, entityId, initiatedBy)`** — auto-approves if no rule matches; otherwise creates `approval_requests` at `currentStep = firstStep.stepOrder` and records a `submitted` action.
4. **`processAction(requestId, actorId, action, comment?)`** — appends action to `approval_actions`, advances `currentStep` or finalizes the request and updates the entity's status.

`approvalRequests` has **no `organizationId` column** — filtering by org requires joining through the approvable entity.

### 3-Way Match deep dive

`MatchingService` (`modules/invoices/matching.service.ts`):

Tolerances (constants at top of file, easy to adjust):
```typescript
const PRICE_TOLERANCE_PCT = 2;   // 2% price variance allowed
const QTY_TOLERANCE_PCT = 5;     // 5% quantity variance allowed
```

Per-line logic:
1. Match `invoiceLine.poLineId` → PO line
2. Sum all `goods_receipt_lines.quantity_received` where `po_line_id` matches
3. Compare invoice unit price to PO unit price
4. Compare invoice quantity to total received
5. Write immutable row to `match_results`

Overall `invoice.match_status`:
- `full_match` — all lines are `match`
- `partial_match` — no exceptions but not all match
- `exception` — any line has `exception` status

`invoice.status` mirrors this: `pending_match` → `matched` | `partial_match` | `exception` → `approved`.

---

## 5. Frontend Pages

All pages under `apps/web/src/app/`. Next.js 15 App Router — server components by default; `'use client'` only for forms and interactive components.

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server | Dashboard metric cards (live API counts) |
| `/vendors` | Server | Vendor list table |
| `/requisitions` | Server | REQ list with status badges |
| `/requisitions/new` | Client | Create form with dynamic line items |
| `/requisitions/[id]` | Server + Server Actions | Detail + submit/cancel |
| `/purchase-orders` | Server | PO list |
| `/purchase-orders/new` | Client | Create form |
| `/purchase-orders/[id]` | Server + Server Actions | Detail + issue/cancel, version history |
| `/approvals` | Server | Pending approval queue |
| `/approvals/[id]` | Server + Server Actions | Detail + approve/reject with comment |
| `/budgets` | Server | Budget list with utilization bars |
| `/budgets/new` | Client | Create budget form |
| `/receiving` | Server | GRN list |
| `/receiving/new` | Client | GRN form with PO selector + per-line qty inputs |
| `/receiving/[id]` | Server | GRN detail with PO line comparison |
| `/invoices` | Server | Invoice list with match status |
| `/invoices/new` | Client | Invoice form with optional PO linking |
| `/invoices/[id]` | Server | Invoice detail with line-level match results |

### Async params in Next.js 15

Route params are `Promise<{ id: string }>` in Next.js 15:
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

### NEXT_PUBLIC_API_URL

Set via environment. Build-time variable baked into the client bundle. In `ecosystem.config.js` this is `http://localhost:4001/api/v1`. Update this for any non-localhost deployment.

---

## 6. Key Architectural Patterns

### Drizzle transaction pattern

**Do not** call `db.query.*` (relational queries) inside a `db.transaction()` callback — they use a different connection context and return empty results. Always return only the inserted ID from the transaction, then fetch outside:

```typescript
// ✅ Correct
const entityId = await this.db.transaction(async (tx) => {
  const [row] = await tx.insert(table).values({...}).returning();
  await tx.insert(otherTable).values({ parentId: row.id, ... });
  return row.id;  // return only primitives
});
return this.findOne(entityId, organizationId);  // relational query outside tx

// ❌ Wrong — returns empty result
const id = await this.db.transaction(async (tx) => {
  const [row] = await tx.insert(table).values({...}).returning();
  const full = await tx.query.table.findFirst({ with: { relations: true } }); // broken
  return full;
});
```

### DB injection pattern

```typescript
constructor(@Inject(DB_TOKEN) private readonly db: Db) {}
```

`DB_TOKEN` is the injection token from `database.module.ts`. `Db` is the typed Drizzle client from `@betterspend/db`.

### Relational queries

```typescript
// Use db.query.* for reads with relations
const result = await this.db.query.tableName.findFirst({
  where: (t, { and, eq }) => and(eq(t.orgId, orgId), eq(t.id, id)),
  with: { relatedTable: true },
});

// Use db.insert/update/delete for mutations
await this.db.update(table).set({ field: value }).where(eq(table.id, id));
```

### Module registration

Every new module must be added to `apps/api/src/app.module.ts` `imports` array. Forgetting this results in a 404 for the module's routes — NestJS silently skips unregistered modules.

---

## 7. Critical Gotchas

### 1. pnpm path
pnpm is installed to a non-standard location:
```bash
export PNPM_HOME="/home/ubuntu/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
```
Add this to your shell profile or prefix all `pnpm` commands with this export.

### 2. pm2 binary location
```bash
export PATH="/home/ubuntu/.bun/bin:$PATH"
# or use the full path: /home/ubuntu/.bun/bin/pm2
```

### 3. NestJS reads `API_PORT`, not `PORT`
`main.ts` uses `process.env.API_PORT`. The ecosystem.config.js passes `API_PORT: 4001`. If you see NestJS starting on port 3001 unexpectedly, this is why.

### 4. Next.js pm2 script path
The ecosystem.config.js must use:
```js
script: 'node_modules/next/dist/bin/next'  // ✅ Node.js script
// NOT:
script: 'node_modules/.bin/next'           // ❌ bash shebang — pm2 can't run it
```

### 5. conditions column is TEXT, not JSONB
`approval_rules.conditions` is stored as a `TEXT` column (JSON string), not native `JSONB`. The service explicitly `JSON.stringify()` on write and `JSON.parse()` on read. This is an intentional choice to avoid Drizzle JSONB operator limitations.

### 6. approvalRequests has no organizationId
The `approval_requests` table has no `organization_id` column. `listPending()` returns all pending requests globally. Org-scoping requires joining through the approvable entity (requisition or PO). This is a known limitation to address when multi-user auth is wired.

### 7. `esModuleInterop: true` required
`apps/api/tsconfig.json` must have `"esModuleInterop": true` for postgres.js CJS/ESM compatibility. Do not remove it.

### 8. Shared packages must be built before apps
The monorepo uses compiled packages (`packages/*/dist/`). Running the API without building `@betterspend/db` and `@betterspend/shared` first causes module-not-found errors.

---

## 8. Demo Data & Testing

### Seed contents (after `pnpm db:seed`)

- **Organization:** Acme Corp (`id: 00000000-0000-0000-0000-000000000001`)
- **Users:** Admin user (`id: 00000000-0000-0000-0000-000000000002`) + 2 additional users
- **Departments:** Engineering, Procurement, Finance
- **Vendors:** 3 vendors (Office Supplies Co., Tech Hardware Ltd., Maintenance Services Inc.)
- **Sequences:** All 4 sequence types initialized at 0
- **Sample data:** 1 requisition (`REQ-2026-0001`) + 1 PO (`PO-2026-0001`)

### Re-seeding (idempotent)

```bash
docker exec betterspend-postgres psql -U betterspend -d betterspend \
  -c "TRUNCATE organizations CASCADE;"
cd packages/db && pnpm exec tsx src/seed.ts
```

### End-to-end smoke test (full P2P cycle)

```bash
BASE="http://localhost:4001/api/v1"

# 1. Create approval rule for amounts >= 500
curl -s -X POST $BASE/approval-rules -H "Content-Type: application/json" -d '{
  "name": "Manager Approval",
  "priority": 100,
  "conditions": {"operator":">=","field":"totalAmount","value":"500"},
  "steps": [{"stepOrder":1,"approverType":"user","approverId":"00000000-0000-0000-0000-000000000002","requiredCount":1}]
}'

# 2. Create requisition
curl -s -X POST $BASE/requisitions -H "Content-Type: application/json" -d '{
  "title": "Office supplies Q1",
  "requesterId": "00000000-0000-0000-0000-000000000002",
  "organizationId": "00000000-0000-0000-0000-000000000001",
  "lines": [{"description":"Paper","quantity":100,"unitPrice":12,"vendorId":"<vendor-id>"}]
}'

# 3. Submit → triggers approval engine
curl -s -X POST $BASE/requisitions/<req-id>/submit

# 4. Approve
curl -s -X POST $BASE/approvals/<request-id>/action \
  -H "Content-Type: application/json" -d '{"action":"approve"}'

# 5. Create PO from approved REQ
# 6. Set PO to issued (DB update or POST /purchase-orders/:id/issue after approval)
# 7. Create GRN against PO
# 8. Create invoice → 3-way match runs automatically
# 9. Approve invoice (if no exceptions)
```

---

## 9. How to Add a New Module

Follow this pattern (example: adding a `contracts` module):

### 1. Schema (`packages/db/src/schema/contracts.ts`)
```typescript
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  // ...
});
```

### 2. Export from index (`packages/db/src/schema/index.ts`)
```typescript
export * from './contracts';
```

### 3. Add relations (`packages/db/src/relations.ts`)
```typescript
export const contractsRelations = relations(contracts, ({ one }) => ({
  organization: one(organizations, { fields: [contracts.organizationId], references: [organizations.id] }),
}));
```

### 4. Generate and run migration
```bash
pnpm db:generate   # creates new migration file
pnpm db:migrate    # applies it
pnpm -C packages/db run build  # rebuild package
```

### 5. Service (`apps/api/src/modules/contracts/contracts.service.ts`)
```typescript
@Injectable()
export class ContractsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}
  // CRUD methods...
}
```

### 6. Controller + Module — follow any existing module as template

### 7. Register in `apps/api/src/app.module.ts`
```typescript
import { ContractsModule } from './modules/contracts/contracts.module';
// add ContractsModule to imports: []
```

### 8. Rebuild and restart
```bash
cd apps/api && pnpm exec nest build
pm2 restart betterspend-api
```

### 9. Frontend page (`apps/web/src/app/contracts/page.tsx`)
Follow the server component pattern from any existing `page.tsx`.

### 10. Add to sidebar nav
Edit `apps/web/src/components/sidebar-nav.tsx` — add entry to `navItems`.

---

## 10. Remaining Work (Phases 5–7)

### Phase 5 — Integrations

**Webhook system:**
- `WebhooksModule` — CRUD for `webhook_endpoints` (URL, secret, events filter)
- Delivery worker (BullMQ): dequeue events, POST to endpoint URL, HMAC-SHA256 sign payload, retry with exponential backoff, record attempts in `webhook_deliveries`
- Events to emit: `requisition.submitted`, `po.issued`, `grn.created`, `invoice.matched`, `invoice.approved`

**GL Export:**
- QuickBooks Online integration: OAuth2 PKCE flow, map PO/invoice to QBO Bill, sync on invoice approval
- Xero integration: similar pattern via Xero API v2
- GL mapping config: `gl_mappings` table mapping BetterSpend GL accounts to QBO/Xero account codes
- Export queue job (BullMQ): triggered on `invoice.approved` event

### Phase 6 — AI/OCR & Catalog

**Invoice OCR:**
- Upload PDF/image to MinIO via `documents` table
- Queue job: send to Claude or GPT-4 Vision API, parse vendor name, invoice number, line items, amounts
- Auto-populate invoice creation form with extracted fields
- Confidence scores stored in `match_details` JSONB

**Catalog management:**
- Full CRUD for `catalog_items` (sku, name, category, unit price, vendor)
- Catalog selector in requisition line item form
- Auto-fill price and vendor from catalog selection

**Punchout (cXML):**
- Vendor `punchout_enabled` + `punchout_config` fields already in schema
- Implement cXML PunchOutSetupRequest/Response flow
- Return cart items as requisition lines

### Phase 7 — Production Polish

**Authentication (better-auth):**
- Replace hardcoded `DEMO_ORG_ID` / `DEMO_ADMIN_ID` in all controllers
- JWT session middleware, `@CurrentUser()` decorator populated from verified token
- OIDC/SAML SSO for enterprise customers
- Role-based route guards (`@Roles('admin')`, `@Roles('approver')`)
- Organization onboarding flow (signup, org creation, invite users)

**Analytics & Reporting:**
- Spend by vendor/department/GL account (time series)
- PO cycle time (created → issued → received → invoiced)
- Budget utilization with burn rate projections
- Invoice aging report (unpaid invoices by due date)
- Approval SLA tracking (time in each approval step)

**UI Polish (shadcn/ui integration):**
- Replace inline-style components with proper shadcn/ui + Tailwind classes
- Dark mode support
- Mobile-responsive layouts (sidebar collapses to drawer on mobile)
- Toast notifications for async actions
- Loading skeletons for server component hydration

**Production hardening:**
- better-auth session store in Redis
- Rate limiting (NestJS ThrottlerModule)
- Helmet security headers
- Database connection pooling (PgBouncer)
- PostgreSQL `audit_log` partitioned by month
- Structured logging (Pino) with correlation IDs
- Health check endpoint (`/api/health`)
- Docker multi-stage build for minimal production image
- Backup strategy for PostgreSQL + MinIO

---

## Quick Reference

### Status enums

| Entity | Status values |
|--------|--------------|
| Requisition | `draft` → `pending_approval` → `approved` / `rejected` → `converted` / `cancelled` |
| Purchase Order | `draft` → `pending_approval` → `approved` → `issued` → `partially_received` → `received` → `partially_invoiced` → `invoiced` → `closed` / `cancelled` |
| GRN | `draft` → `confirmed` / `cancelled` |
| Invoice | `draft` → `pending_match` → `matched` / `partial_match` / `exception` → `approved` → `paid` |
| Approval Request | `pending` → `approved` / `rejected` |

### Numeric precision

All monetary amounts: `NUMERIC(14, 2)` — 14 total digits, 2 decimal places.
All quantities: `NUMERIC(10, 2)`.
Stored as strings in JavaScript; always `parseFloat()` before arithmetic.

### File upload (future)

Documents table has `storage_key` (MinIO object key), `content_type`, `size`, `entity_type` + `entity_id` (polymorphic). MinIO bucket must be created on first startup — the seed script does not currently create it.
