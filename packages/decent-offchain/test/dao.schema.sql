CREATE TYPE "onchain"."token_type" AS ENUM('ERC20', 'ERC721', 'ERC1155');--> statement-breakpoint
CREATE TABLE "onchain"."dao" (
	"dao_chain_id" integer NOT NULL,
	"dao_address" text NOT NULL,
	"dao_name" text,
	"proposal_templates_cid" text,
	"snapshot_ens" text,
	"sub_dao_of" text,
	"top_hat_id" text,
	"hat_id_to_stream_id" text,
	"gas_tank_enabled" boolean,
	"gas_tank_address" text,
	"required_signatures" integer,
	"guard_address" text,
	"fractal_module_address" text,
	"created_at" bigint,
	"updated_at" bigint,
	CONSTRAINT "dao_dao_chain_id_dao_address_pk" PRIMARY KEY("dao_chain_id","dao_address")
);
--> statement-breakpoint
CREATE TABLE "onchain"."governance_module" (
	"governance_module_address" text PRIMARY KEY NOT NULL,
	"dao_chain_id" integer NOT NULL,
	"dao_address" text NOT NULL,
	"governance_module_name" text,
	"governance_module_description" text
);
--> statement-breakpoint
CREATE TABLE "onchain"."signer" (
	"signer_address" text PRIMARY KEY NOT NULL,
	"signer_label" text
);
--> statement-breakpoint
CREATE TABLE "onchain"."signer_to_dao" (
	"std_signer_address" text NOT NULL,
	"std_dao_chain_id" integer NOT NULL,
	"std_dao_address" text NOT NULL,
	CONSTRAINT "signer_to_dao_std_signer_address_std_dao_chain_id_std_dao_address_pk" PRIMARY KEY("std_signer_address","std_dao_chain_id","std_dao_address")
);
--> statement-breakpoint
CREATE TABLE "onchain"."voting_strategy" (
	"voting_strategy_address" text PRIMARY KEY NOT NULL,
	"governance_module_id" text NOT NULL,
	"min_proposer_balance" text,
	"voting_strategy_name" text,
	"voting_strategy_description" text,
	"voting_strategy_enabled_at" bigint,
	"voting_strategy_disabled_at" bigint
);
--> statement-breakpoint
CREATE TABLE "onchain"."voting_token" (
	"voting_token_address" text PRIMARY KEY NOT NULL,
	"voting_strategy_id" text NOT NULL,
	"type" "onchain"."token_type" NOT NULL
);
