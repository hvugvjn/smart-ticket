import { db } from "./db";
import { 
  shows, 
  seats, 
  bookings, 
  users,
  seatLocks,
  refunds,
  type Show,
  type Seat,
  type Booking,
  type User,
  type SeatLock,
  type Refund,
  type InsertShow,
  type InsertSeat,
  type InsertBooking,
  type InsertUser,
  type InsertSeatLock,
  type InsertRefund,
  type BookSeatsRequest,
} from "@shared/schema";
import { eq, and, inArray, sql, lt, gt } from "drizzle-orm";

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
  
  // Seat locking
  lockSeat(showId: number, seatId: number, userId: string, expiresAt: Date): Promise<SeatLock | null>;
  unlockSeat(showId: number, seatId: number, userId: string): Promise<boolean>;
  getLockedSeats(showId: number): Promise<SeatLock[]>;
  cleanupExpiredLocks(): Promise<number>;
  
  // Cancellation and refunds
  getBookingById(id: number): Promise<Booking | undefined>;
  getBookingsByUserId(userId: string): Promise<Booking[]>;
  cancelBooking(id: number, refundAmount: number, reason: string): Promise<{ booking: Booking; refund: Refund } | null>;
  getRefundByBookingId(bookingId: number): Promise<Refund | undefined>;
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

  // Seat locking methods
  async lockSeat(showId: number, seatId: number, userId: string, expiresAt: Date): Promise<SeatLock | null> {
    // First check if seat is already locked by someone else
    const existingLock = await db
      .select()
      .from(seatLocks)
      .where(
        and(
          eq(seatLocks.showId, showId),
          eq(seatLocks.seatId, seatId),
          gt(seatLocks.expiresAt, new Date())
        )
      );
    
    if (existingLock.length > 0 && existingLock[0].userId !== userId) {
      return null; // Locked by someone else
    }
    
    // If already locked by same user, update expiry
    if (existingLock.length > 0) {
      const updated = await db
        .update(seatLocks)
        .set({ expiresAt })
        .where(eq(seatLocks.id, existingLock[0].id))
        .returning();
      return updated[0];
    }
    
    // Create new lock
    const result = await db
      .insert(seatLocks)
      .values({ showId, seatId, userId, expiresAt })
      .returning();
    return result[0];
  }

  async unlockSeat(showId: number, seatId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(seatLocks)
      .where(
        and(
          eq(seatLocks.showId, showId),
          eq(seatLocks.seatId, seatId),
          eq(seatLocks.userId, userId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getLockedSeats(showId: number): Promise<SeatLock[]> {
    return await db
      .select()
      .from(seatLocks)
      .where(
        and(
          eq(seatLocks.showId, showId),
          gt(seatLocks.expiresAt, new Date())
        )
      );
  }

  async cleanupExpiredLocks(): Promise<number> {
    const result = await db
      .delete(seatLocks)
      .where(lt(seatLocks.expiresAt, new Date()))
      .returning();
    return result.length;
  }

  // Cancellation and refund methods
  async getBookingById(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async getBookingsByUserId(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async cancelBooking(id: number, refundAmount: number, reason: string): Promise<{ booking: Booking; refund: Refund } | null> {
    const booking = await this.getBookingById(id);
    if (!booking || booking.status === "CANCELLED") {
      return null;
    }

    // Update booking status
    const updatedBooking = await db
      .update(bookings)
      .set({ status: "CANCELLED" })
      .where(eq(bookings.id, id))
      .returning();

    // Create refund record
    const refund = await db
      .insert(refunds)
      .values({
        bookingId: id,
        amount: refundAmount.toFixed(2),
        status: "COMPLETED",
        reason,
        processedAt: new Date(),
      })
      .returning();

    return { booking: updatedBooking[0], refund: refund[0] };
  }

  async getRefundByBookingId(bookingId: number): Promise<Refund | undefined> {
    const result = await db.select().from(refunds).where(eq(refunds.bookingId, bookingId));
    return result[0];
  }
}

export const storage = new PostgresStorage();
