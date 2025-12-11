import { db } from "./db";
import { 
  shows, 
  seats, 
  bookings, 
  users,
  type Show,
  type Seat,
  type Booking,
  type User,
  type InsertShow,
  type InsertSeat,
  type InsertBooking,
  type InsertUser,
  type BookSeatsRequest,
} from "@shared/schema";
import { eq, and, inArray, sql, lt } from "drizzle-orm";

export interface IStorage {
  getShows(): Promise<Show[]>;
  getShow(id: number): Promise<Show | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  
  getSeats(showId: number): Promise<Seat[]>;
  getSeatsByIds(seatIds: number[]): Promise<Seat[]>;
  createSeats(seats: InsertSeat[]): Promise<Seat[]>;
  
  getBookingByIdempotencyKey(key: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  confirmBooking(id: number): Promise<Booking | undefined>;
  expireOldBookings(): Promise<number>;
  getBookedSeatIds(showId: number): Promise<number[]>;
  
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOtp(phoneNumber: string, otp: string, expiresAt: Date): Promise<User | undefined>;
  incrementOtpAttempts(phoneNumber: string): Promise<void>;
  resetOtpAttempts(phoneNumber: string): Promise<void>;
  
  // Email-based auth
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithEmail(user: { email: string; otp: string | null; otpExpiresAt: Date | null; otpAttempts: number; lastOtpRequestAt: Date | null }): Promise<User>;
  updateUserOtpByEmail(email: string, otp: string, expiresAt: Date): Promise<User | undefined>;
  incrementOtpAttemptsByEmail(email: string): Promise<void>;
  resetOtpAttemptsByEmail(email: string): Promise<void>;
  updateUserGender(id: number, gender: string): Promise<User | undefined>;
}

export class PostgresStorage implements IStorage {
  async getShows(): Promise<Show[]> {
    return await db.select().from(shows);
  }

  async getShow(id: number): Promise<Show | undefined> {
    const result = await db.select().from(shows).where(eq(shows.id, id));
    return result[0];
  }

  async createShow(show: InsertShow): Promise<Show> {
    const result = await db.insert(shows).values(show).returning();
    return result[0];
  }

  async getSeats(showId: number): Promise<Seat[]> {
    return await db.select().from(seats).where(eq(seats.showId, showId));
  }

  async getSeatsByIds(seatIds: number[]): Promise<Seat[]> {
    if (seatIds.length === 0) return [];
    return await db.select().from(seats).where(inArray(seats.id, seatIds));
  }

  async createSeats(seatsData: InsertSeat[]): Promise<Seat[]> {
    if (seatsData.length === 0) return [];
    return await db.insert(seats).values(seatsData).returning();
  }

  async getBookingByIdempotencyKey(key: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.idempotencyKey, key));
    return result[0];
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async confirmBooking(id: number): Promise<Booking | undefined> {
    const result = await db
      .update(bookings)
      .set({ status: "CONFIRMED", confirmedAt: new Date(), expiresAt: null })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async expireOldBookings(): Promise<number> {
    const result = await db
      .update(bookings)
      .set({ status: "EXPIRED" })
      .where(
        and(
          eq(bookings.status, "PENDING"),
          lt(bookings.expiresAt, new Date())
        )
      )
      .returning();
    return result.length;
  }

  async getBookedSeatIds(showId: number): Promise<number[]> {
    const result = await db
      .select({ seatIds: bookings.seatIds })
      .from(bookings)
      .where(
        and(
          eq(bookings.showId, showId),
          inArray(bookings.status, ["PENDING", "CONFIRMED"])
        )
      );
    
    const allSeatIds: number[] = [];
    result.forEach(r => {
      if (r.seatIds) {
        allSeatIds.push(...r.seatIds);
      }
    });
    return allSeatIds;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserOtp(phoneNumber: string, otp: string, expiresAt: Date): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ otp, otpExpiresAt: expiresAt, lastOtpRequestAt: new Date() })
      .where(eq(users.phoneNumber, phoneNumber))
      .returning();
    return result[0];
  }

  async incrementOtpAttempts(phoneNumber: string): Promise<void> {
    await db
      .update(users)
      .set({ otpAttempts: sql`${users.otpAttempts} + 1` })
      .where(eq(users.phoneNumber, phoneNumber));
  }

  async resetOtpAttempts(phoneNumber: string): Promise<void> {
    await db
      .update(users)
      .set({ otpAttempts: 0 })
      .where(eq(users.phoneNumber, phoneNumber));
  }

  // Email-based auth methods
  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUserWithEmail(user: { email: string; otp: string | null; otpExpiresAt: Date | null; otpAttempts: number; lastOtpRequestAt: Date | null }): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserOtpByEmail(email: string, otp: string, expiresAt: Date): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ otp, otpExpiresAt: expiresAt, lastOtpRequestAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return result[0];
  }

  async incrementOtpAttemptsByEmail(email: string): Promise<void> {
    await db
      .update(users)
      .set({ otpAttempts: sql`${users.otpAttempts} + 1` })
      .where(eq(users.email, email));
  }

  async resetOtpAttemptsByEmail(email: string): Promise<void> {
    await db
      .update(users)
      .set({ otpAttempts: 0 })
      .where(eq(users.email, email));
  }

  async updateUserGender(id: number, gender: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ gender })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
