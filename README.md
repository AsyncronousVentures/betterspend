# BetterSpend

An open-source, single-tenant **Procure-to-Pay (P2P) management system** covering the full procurement lifecycle — from purchase requisitions through vendor invoicing and 3-way matching. Built to rival commercial tools like Procurify and Odoo, with immutable audit trails, a dynamic approval engine, and clean REST APIs as core design principles.

---

## Features

### Procure-to-Pay Lifecycle
- **Requisitions** — draft, submit for approval, convert to PO
- **Purchase Orders** — create (standalone or from requisition), issue to vendor, version history with change orders, PDF export
- **Receiving** — goods receipt notes (GRNs) against issued POs with partial receipt support and automatic PO status progression
- **Invoices** — vendor invoice intake with automatic 3-way match (PO ↔ GRN ↔ Invoice) and Finance approval workflow

### Approval Engine
- JSONB condition expression trees: `{"operator":"AND","conditions":[{"field":"totalAmount","operator":">=","value":1000}]}`
- Multi-step sequential approval chains with configurable `requiredCount` per step
- Priority-ordered rule evaluation — first matching rule wins
- Auto-approval when no rule matches
- All actions append-only (immutable) — full audit trail preserved forever

### 3-Way Match
- Line-by-line comparison: invoice unit price vs PO price (2% tolerance), invoice quantity vs total GRN received quantity (5% tolerance)
- Statuses: `full_match` | `partial_match` | `exception`
- Exception flagging blocks Finance approval until manually reviewed

### Additional Modules
- **Vendors** — vendor master with JSONB address/contact, payment terms, status lifecycle
- **Users** — user management with scoped roles (global/department/project)
- **Budgets** — department/project/GL account budget tracking with spend recording and availability checks
- **Audit Log** — append-only log of every mutation with before/after JSON diff
- **Number Sequences** — gap-free auto-numbering: `REQ-2026-0001`, `PO-2026-0001`, `GRN-2026-0001`, `INV-2026-0001`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | NestJS v10 (TypeScript) |
| Frontend | Next.js 15 App Router |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Queue | BullMQ + Redis _(scaffolded, Phase 5)_ |
| File Storage | MinIO / S3-compatible _(scaffolded, Phase 6)_ |
| Auth | better-auth _(Phase 7)_ |
| UI | shadcn/ui + Tailwind CSS _(Phase 7)_ |
| Validation | Zod (shared between API and frontend) |

---

## Repository Structure

```
betterspend/
├── apps/
│   ├── api/                    NestJS backend
│   │   └── src/
│   │       ├── common/         Audit interceptor, decorators, sequence service
│   │       ├── database/       Drizzle module (DB_TOKEN injection)
│   │       └── modules/        Feature modules (one per domain)
│   │           ├── approval-rules/
│   │           ├── approvals/
│   │           ├── budgets/
│   │           ├── invoices/
│   │           ├── purchase-orders/
│   │           ├── receiving/
│   │           ├── requisitions/
│   │           ├── users/
│   │           └── vendors/
│   └── web/                    Next.js 15 frontend
│       └── src/
│           ├── app/            App Router pages (one folder per route)
│           ├── components/     Shared components (sidebar nav)
│           └── lib/            API fetch utility
├── packages/
│   ├── db/                     Drizzle schema, relations, migrations, seed
│   │   └── src/schema/         One file per domain entity
│   └── shared/                 Zod schemas, TypeScript types, constants
├── docker-compose.yml
├── ecosystem.config.js         pm2 process config (production)
└── turbo.json
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- pnpm (`wget -qO- https://get.pnpm.io/install.sh | bash`)

### 1. Clone and install

```bash
git clone https://github.com/AsyncronousVentures/betterspend.git
cd betterspend
cp .env.example .env
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
# Starts: PostgreSQL 16 (port 5433), Redis 7, MinIO (ports 9000/9001)
```

> **Note:** PostgreSQL is mapped to port **5433** (not 5432) to avoid conflicts with a host-level Postgres instance.

### 3. Set up the database

```bash
pnpm db:migrate    # Apply all schema migrations
pnpm db:seed       # Load demo data (Acme Corp org, vendors, users, sample REQ + PO)
```

### 4. Run in development

```bash
pnpm dev           # Starts api on :3001 and web on :3000 concurrently
```

### 5. Open the app

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger Docs | http://localhost:3001/api/docs |
| Drizzle Studio | http://localhost:4983 (`pnpm db:studio`) |
| MinIO Console | http://localhost:9001 (minioadmin / minioadmin) |

---

## API Reference

All endpoints are under `/api/v1`. Full interactive docs available at `/api/docs` (Swagger UI with OpenAPI 3.1).

### Vendors
| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendors` | List all vendors |
| POST | `/vendors` | Create vendor |
| GET | `/vendors/:id` | Get vendor detail |
| PATCH | `/vendors/:id` | Update vendor |
| DELETE | `/vendors/:id` | Deactivate vendor |

### Requisitions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/requisitions` | List (`?status=`, `?departmentId=`) |
| POST | `/requisitions` | Create with line items |
| GET | `/requisitions/:id` | Detail |
| POST | `/requisitions/:id/submit` | Submit for approval |
| POST | `/requisitions/:id/cancel` | Cancel |

### Purchase Orders
| Method | Path | Description |
|--------|------|-------------|
| GET | `/purchase-orders` | List (`?status=`, `?vendorId=`) |
| POST | `/purchase-orders` | Create |
| GET | `/purchase-orders/:id` | Detail with lines and versions |
| GET | `/purchase-orders/:id/versions` | Immutable version history |
| GET | `/purchase-orders/:id/pdf` | Download PDF |
| POST | `/purchase-orders/:id/issue` | Issue to vendor |
| POST | `/purchase-orders/:id/change-order` | Create change order (bumps version) |
| POST | `/purchase-orders/:id/cancel` | Cancel |

### Approvals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/approval-rules` | List rules |
| POST | `/approval-rules` | Create rule with steps |
| GET | `/approval-rules/:id` | Rule detail |
| PATCH | `/approval-rules/:id` | Update rule |
| DELETE | `/approval-rules/:id` | Deactivate rule |
| GET | `/approvals/pending` | Pending approval queue |
| GET | `/approvals/:id` | Request detail with action history |
| POST | `/approvals/:id/action` | `{ action: "approve" \| "reject", comment? }` |

### Receiving
| Method | Path | Description |
|--------|------|-------------|
| GET | `/receiving` | List GRNs |
| POST | `/receiving` | Create GRN (auto-updates PO status) |
| GET | `/receiving/:id` | GRN detail with line comparison |

### Invoices
| Method | Path | Description |
|--------|------|-------------|
| GET | `/invoices` | List with match status |
| POST | `/invoices` | Create (auto-runs 3-way match if PO linked) |
| GET | `/invoices/:id` | Detail with line-level match results |
| POST | `/invoices/:id/match` | Re-run 3-way match |
| PATCH | `/invoices/:id/approve` | Finance approval (blocked if exceptions) |

### Budgets
| Method | Path | Description |
|--------|------|-------------|
| GET | `/budgets` | List budgets |
| POST | `/budgets` | Create budget |
| GET | `/budgets/:id` | Detail with periods |
| GET | `/budgets/:id/check?amount=X` | Availability check |

---

## Development Commands

```bash
pnpm dev              # Start api + web in development mode
pnpm build            # Build all packages and apps
pnpm typecheck        # TypeScript check all packages
pnpm lint             # ESLint all packages
pnpm format           # Prettier format all files

pnpm db:generate      # Generate Drizzle migrations from schema changes
pnpm db:migrate       # Run pending migrations
pnpm db:seed          # Seed demo data
pnpm db:studio        # Open Drizzle Studio (visual DB browser)
```

---

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| 1 — Foundation | ✅ Complete | Monorepo, DB schema, auth scaffold, vendors, users, audit |
| 2 — Requisitions & POs | ✅ Complete | REQ/PO CRUD, number sequences, PO versioning, PDF export |
| 3 — Approval Engine & Budgets | ✅ Complete | Dynamic rule engine, multi-step chains, budget tracking |
| 4 — Receiving & Invoicing | ✅ Complete | GRN creation, 3-way match, Finance approval workflow |
| 5 — Integrations | 🔜 Next | Webhook delivery (HMAC + retry), GL export (QuickBooks/Xero) |
| 6 — AI/OCR & Catalog | 🔜 Planned | Invoice OCR via LLM vision, AI-assisted requisitions, Punchout |
| 7 — Production Polish | 🔜 Planned | better-auth SSO/OIDC/SAML, spend analytics dashboards, mobile |

---

## License

MIT
