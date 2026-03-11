CREATE TABLE "recurring_pos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "created_by_id" uuid NOT NULL,
  "vendor_id" uuid,
  "title" varchar(255) NOT NULL,
  "description" text,
  "frequency" varchar(30) NOT NULL,
  "day_of_month" integer,
  "next_run_at" timestamp with time zone NOT NULL,
  "last_run_at" timestamp with time zone,
  "active" boolean DEFAULT true NOT NULL,
  "total_amount" numeric(14, 2) NOT NULL,
  "currency" varchar(3) DEFAULT 'USD' NOT NULL,
  "lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "gl_account" varchar(50),
  "notes" text,
  "run_count" integer DEFAULT 0 NOT NULL,
  "max_runs" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring_pos" ADD CONSTRAINT "recurring_pos_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_pos" ADD CONSTRAINT "recurring_pos_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_pos" ADD CONSTRAINT "recurring_pos_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
