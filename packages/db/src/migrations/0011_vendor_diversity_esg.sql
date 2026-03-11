ALTER TABLE "vendors" ADD COLUMN "diversity_categories" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "esg_rating" varchar(10);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "carbon_footprint_tons" varchar(20);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "sustainability_certifications" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "esg_notes" text;
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "diversity_verified_at" timestamp with time zone;
