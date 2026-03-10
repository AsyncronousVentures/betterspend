CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"parent_id" uuid,
	"budget_owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"logo_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"department_id" uuid,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"scope_type" varchar(50) DEFAULT 'global' NOT NULL,
	"scope_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"department_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid,
	"sku" varchar(100),
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"category" varchar(100),
	"unit_of_measure" varchar(50) DEFAULT 'each' NOT NULL,
	"unit_price" varchar(20) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"tax_id" varchar(100),
	"payment_terms" varchar(100),
	"address" jsonb DEFAULT '{}'::jsonb,
	"contact_info" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"punchout_enabled" boolean DEFAULT false NOT NULL,
	"punchout_config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"year" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requisition_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requisition_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"catalog_item_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'each' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(14, 2) NOT NULL,
	"vendor_id" uuid,
	"gl_account" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"department_id" uuid,
	"project_id" uuid,
	"number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"needed_by" timestamp with time zone,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"source_type" varchar(30) DEFAULT 'manual' NOT NULL,
	"source_document_id" uuid,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requisitions_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "approval_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"approval_request_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"approver_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"comment" text,
	"acted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"approvable_type" varchar(50) NOT NULL,
	"approvable_id" uuid NOT NULL,
	"approval_rule_id" uuid,
	"current_step" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_rule_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"approval_rule_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"approver_type" varchar(50) NOT NULL,
	"approver_id" uuid,
	"approver_role" varchar(50),
	"required_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"priority" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"conditions" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blanket_releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blanket_po_id" uuid NOT NULL,
	"release_number" integer NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"released_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "po_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"requisition_line_id" uuid,
	"line_number" integer NOT NULL,
	"catalog_item_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'each' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(14, 2) NOT NULL,
	"quantity_received" numeric(10, 2) DEFAULT '0' NOT NULL,
	"quantity_invoiced" numeric(10, 2) DEFAULT '0' NOT NULL,
	"gl_account" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "po_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"change_reason" text,
	"changed_by" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"diff_summary" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requisition_id" uuid,
	"vendor_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"po_type" varchar(20) DEFAULT 'standard' NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"issued_by" uuid,
	"issued_at" timestamp with time zone,
	"payment_terms" varchar(100),
	"shipping_address" jsonb DEFAULT '{}'::jsonb,
	"billing_address" jsonb DEFAULT '{}'::jsonb,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"pdf_document_id" uuid,
	"blanket_start_date" timestamp with time zone,
	"blanket_end_date" timestamp with time zone,
	"blanket_total_limit" numeric(14, 2),
	"blanket_released_amount" numeric(14, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goods_receipt_id" uuid NOT NULL,
	"po_line_id" uuid NOT NULL,
	"quantity_received" numeric(10, 2) NOT NULL,
	"quantity_rejected" numeric(10, 2) DEFAULT '0' NOT NULL,
	"rejection_reason" text,
	"storage_location" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"received_by" uuid NOT NULL,
	"received_date" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goods_receipts_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"po_line_id" uuid,
	"line_number" numeric NOT NULL,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(14, 2) NOT NULL,
	"gl_account" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"purchase_order_id" uuid,
	"vendor_id" uuid NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"internal_number" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"invoice_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"document_id" uuid,
	"match_status" varchar(20) DEFAULT 'unmatched' NOT NULL,
	"match_details" jsonb DEFAULT '{}'::jsonb,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_internal_number_unique" UNIQUE("internal_number")
);
--> statement-breakpoint
CREATE TABLE "match_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_line_id" uuid NOT NULL,
	"po_line_id" uuid NOT NULL,
	"grn_line_id" uuid,
	"price_match" boolean DEFAULT false NOT NULL,
	"quantity_match" boolean DEFAULT false NOT NULL,
	"price_variance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"quantity_variance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"variance_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'exception' NOT NULL,
	"tolerance_applied" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"allocated_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"spent_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"budget_type" varchar(30) NOT NULL,
	"scope_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period_type" varchar(20) DEFAULT 'annual' NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"allocated_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"spent_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_endpoint_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"response_status" integer,
	"response_body" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(255) NOT NULL,
	"events" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisition_lines" ADD CONSTRAINT "requisition_lines_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisition_lines" ADD CONSTRAINT "requisition_lines_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisition_lines" ADD CONSTRAINT "requisition_lines_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_approval_request_id_approval_requests_id_fk" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approval_rule_id_approval_rules_id_fk" FOREIGN KEY ("approval_rule_id") REFERENCES "public"."approval_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_rule_steps" ADD CONSTRAINT "approval_rule_steps_approval_rule_id_approval_rules_id_fk" FOREIGN KEY ("approval_rule_id") REFERENCES "public"."approval_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blanket_releases" ADD CONSTRAINT "blanket_releases_blanket_po_id_purchase_orders_id_fk" FOREIGN KEY ("blanket_po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blanket_releases" ADD CONSTRAINT "blanket_releases_released_by_users_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_lines" ADD CONSTRAINT "po_lines_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_lines" ADD CONSTRAINT "po_lines_requisition_line_id_requisition_lines_id_fk" FOREIGN KEY ("requisition_line_id") REFERENCES "public"."requisition_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_lines" ADD CONSTRAINT "po_lines_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_versions" ADD CONSTRAINT "po_versions_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_versions" ADD CONSTRAINT "po_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_po_line_id_po_lines_id_fk" FOREIGN KEY ("po_line_id") REFERENCES "public"."po_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_po_line_id_po_lines_id_fk" FOREIGN KEY ("po_line_id") REFERENCES "public"."po_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_invoice_line_id_invoice_lines_id_fk" FOREIGN KEY ("invoice_line_id") REFERENCES "public"."invoice_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_po_line_id_po_lines_id_fk" FOREIGN KEY ("po_line_id") REFERENCES "public"."po_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_grn_line_id_goods_receipt_lines_id_fk" FOREIGN KEY ("grn_line_id") REFERENCES "public"."goods_receipt_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_periods" ADD CONSTRAINT "budget_periods_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;