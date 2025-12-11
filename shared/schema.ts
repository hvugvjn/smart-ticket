import { pgTable, text, serial, integer, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  operatorName: text("operator_name").notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  duration: text("duration").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  vehicleType: text("vehicle_type").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("4.5"),
  totalSeats: integer("total_seats").notNull().default(40),
  amenities: text("amenities").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const seats = pgTable("seats", {
  id: serial("id").primaryKey(),
  showId: integer("show_id").notNull().references(() => shows.id),
  seatNumber: text("seat_number").notNull(),
  deck: text("deck").notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  type: text("type").notNull(),
  classType: text("class_type").notNull().default("ECONOMY"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  features: text("features").array().notNull().default([]),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  showId: integer("show_id").notNull().references(() => shows.id),
  userId: text("user_id"),
  seatIds: integer("seat_ids").array().notNull(),
  status: text("status").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  passengerDetails: jsonb("passenger_details"),
  gender: text("gender").default("unknown"),
  expiresAt: timestamp("expires_at"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number"),
  email: text("email").notNull().unique(),
  gender: text("gender"),
  role: text("role").notNull().default("user"),
  otp: text("otp"),
  otpExpiresAt: timestamp("otp_expires_at"),
  otpAttempts: integer("otp_attempts").notNull().default(0),
  lastOtpRequestAt: timestamp("last_otp_request_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const seatLocks = pgTable("seat_locks", {
  id: serial("id").primaryKey(),
  showId: integer("show_id").notNull().references(() => shows.id),
  seatId: integer("seat_id").notNull().references(() => seats.id),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("PENDING"),
  reason: text("reason"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
});

export const insertSeatSchema = createInsertSchema(seats).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type Show = typeof shows.$inferSelect;
export type InsertShow = z.infer<typeof insertShowSchema>;

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = z.infer<typeof insertSeatSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertSeatLockSchema = createInsertSchema(seatLocks).omit({
  id: true,
  createdAt: true,
});

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  createdAt: true,
});

export type SeatLock = typeof seatLocks.$inferSelect;
export type InsertSeatLock = z.infer<typeof insertSeatLockSchema>;

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;

export const passengerDetailsSchema = z.object({
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(10),
  idType: z.enum(["Aadhar Card", "Driving Licence", "Passport", "PAN Card", "Voter ID"]),
  idNumber: z.string().min(4),
});

export const bookSeatsSchema = z.object({
  seatIds: z.array(z.number()).min(1).max(6),
  idempotencyKey: z.string(),
  userId: z.union([z.string(), z.number()]).optional(),
  passenger: passengerDetailsSchema.optional(),
});

export type PassengerDetails = z.infer<typeof passengerDetailsSchema>;

export const requestOtpSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string(),
  otp: z.string().length(4),
});

export const requestOtpEmailSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(4),
});

export type BookSeatsRequest = z.infer<typeof bookSeatsSchema>;
export type RequestOtpRequest = z.infer<typeof requestOtpSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type RequestOtpEmailRequest = z.infer<typeof requestOtpEmailSchema>;
export type VerifyOtpEmailRequest = z.infer<typeof verifyOtpEmailSchema>;
