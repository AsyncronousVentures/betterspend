CREATE TABLE "inventory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "public"."organizations"("id") ON DELETE cascade,
  "sku" varchar(100) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "unit" varchar(50) NOT NULL DEFAULT 'each',
  "quantity_on_hand" numeric(12,4) NOT NULL DEFAULT 0,
  "quantity_reserved" numeric(12,4) NOT NULL DEFAULT 0,
  "reorder_point" numeric(12,4),
  "reorder_quantity" numeric(12,4),
  "location" varchar(255),
  "metadata" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE "inventory_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL REFERENCES "public"."inventory_items"("id") ON DELETE cascade,
  "movement_type" varchar(50) NOT NULL,
  "quantity" numeric(12,4) NOT NULL,
  "quantity_before" numeric(12,4) NOT NULL,
  "quantity_after" numeric(12,4) NOT NULL,
  "reference_type" varchar(50),
  "reference_id" uuid,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
