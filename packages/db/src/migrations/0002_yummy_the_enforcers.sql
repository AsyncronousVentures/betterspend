CREATE TABLE "ocr_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"extracted_data" jsonb,
	"confidence" jsonb,
	"error_message" text,
	"invoice_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;