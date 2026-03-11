CREATE TABLE "rfq_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"due_date" timestamp with time zone,
	"awarded_vendor_id" uuid,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rfq_requests_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "rfq_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'each' NOT NULL,
	"target_price" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"sent_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'submitted' NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"valid_until" timestamp with time zone,
	"notes" text,
	"awarded" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq_response_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"rfq_line_id" uuid NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(14, 2) NOT NULL,
	"lead_time_days" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_awarded_vendor_id_vendors_id_fk" FOREIGN KEY ("awarded_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_rfq_id_rfq_requests_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq_requests"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_invitations" ADD CONSTRAINT "rfq_invitations_rfq_id_rfq_requests_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq_requests"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_invitations" ADD CONSTRAINT "rfq_invitations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_rfq_id_rfq_requests_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq_requests"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_response_lines" ADD CONSTRAINT "rfq_response_lines_response_id_rfq_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."rfq_responses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rfq_response_lines" ADD CONSTRAINT "rfq_response_lines_rfq_line_id_rfq_lines_id_fk" FOREIGN KEY ("rfq_line_id") REFERENCES "public"."rfq_lines"("id") ON DELETE cascade ON UPDATE no action;
