CREATE TABLE "contract_amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"amendment_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"effective_date" timestamp with time zone,
	"value_change" numeric(14, 2),
	"new_end_date" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2),
	"unit_of_measure" varchar(50),
	"unit_price" numeric(14, 2),
	"total_price" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'purchase_agreement' NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"vendor_id" uuid,
	"owner_id" uuid,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"total_value" numeric(14, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_terms" varchar(100),
	"auto_renew" boolean DEFAULT false NOT NULL,
	"renewal_notice_days" integer DEFAULT 30 NOT NULL,
	"renewal_term_months" integer,
	"terms" text,
	"internal_notes" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"terminated_by" uuid,
	"terminated_at" timestamp with time zone,
	"termination_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_org_key" UNIQUE("organization_id","key")
);
--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_lines" ADD CONSTRAINT "contract_lines_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_terminated_by_users_id_fk" FOREIGN KEY ("terminated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;