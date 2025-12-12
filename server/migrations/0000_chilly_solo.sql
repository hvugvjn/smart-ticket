CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_id" integer NOT NULL,
	"user_id" text,
	"seat_ids" integer[] NOT NULL,
	"status" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"idempotency_key" text NOT NULL,
	"passenger_details" jsonb,
	"gender" text DEFAULT 'unknown',
	"expires_at" timestamp,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seat_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_id" integer NOT NULL,
	"seat_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seat_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_id" integer NOT NULL,
	"seat_number" text NOT NULL,
	"email" text NOT NULL,
	"notified" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_id" integer NOT NULL,
	"seat_number" text NOT NULL,
	"deck" text NOT NULL,
	"row" integer NOT NULL,
	"col" integer NOT NULL,
	"type" text NOT NULL,
	"class_type" text DEFAULT 'ECONOMY' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_name" text NOT NULL,
	"source" text NOT NULL,
	"destination" text NOT NULL,
	"departure_time" timestamp NOT NULL,
	"arrival_time" timestamp NOT NULL,
	"duration" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"vehicle_type" text NOT NULL,
	"rating" numeric(3, 2) DEFAULT '4.5' NOT NULL,
	"total_seats" integer DEFAULT 40 NOT NULL,
	"amenities" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text,
	"email" text NOT NULL,
	"gender" text,
	"role" text DEFAULT 'user' NOT NULL,
	"otp" text,
	"otp_expires_at" timestamp,
	"otp_attempts" integer DEFAULT 0 NOT NULL,
	"last_otp_request_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_locks" ADD CONSTRAINT "seat_locks_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_locks" ADD CONSTRAINT "seat_locks_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_notifications" ADD CONSTRAINT "seat_notifications_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;