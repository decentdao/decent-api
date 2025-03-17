CREATE TABLE "offchain"."proposals" (
	"slug" varchar PRIMARY KEY DEFAULT 'GQMB4fFb0ffgAouc1neX9' NOT NULL,
	"dao" text NOT NULL,
	"author_address" varchar NOT NULL,
	"status" varchar,
	"cycle" integer,
	"id" integer,
	"safe_tx_hash" varchar,
	"title" text,
	"body" text,
	"vote_type" varchar,
	"vote_choices" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "proposals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "offchain"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"nonce" text NOT NULL,
	"address" text,
	"signature" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "sessions_address_index" ON "offchain"."sessions" USING btree ("address");