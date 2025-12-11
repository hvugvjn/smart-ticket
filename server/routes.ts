import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import redis from "./lib/redis";
import { sendOtpEmail, sendSeatAvailableEmail } from "./lib/mail";
import { sendBookingConfirmationEmail } from "./lib/booking-email";
import { requireAdmin } from "./middleware/requireAdmin";
import { 
  bookSeatsSchema, 
  requestOtpSchema, 
  verifyOtpSchema,
  requestOtpEmailSchema,
  verifyOtpEmailSchema,
  insertShowSchema,
  notifySeatSchema,
  type BookSeatsRequest,
  bookings,
  seats as seatsTable,
  seatLocks,
  users,
} from "@shared/schema";
import { sql, inArray, and, gt } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface SSEClient {
  showId: number;
  res: any;
}

const sseClients: SSEClient[] = [];

function broadcastSeatUpdate(showId: number) {
  sseClients
    .filter(client => client.showId === showId)
    .forEach(client => {
      client.res.write(`data: ${JSON.stringify({ type: "seat_update", showId })}\n\n`);
    });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/shows", async (req, res) => {
    try {
      const shows = await storage.getShows();
      res.json(shows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const show = await storage.getShow(id);
      if (!show) {
        return res.status(404).json({ error: "Show not found" });
      }
      res.json(show);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/shows", requireAdmin, async (req, res) => {
    try {
      const parsed = insertShowSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const show = await storage.createShow(parsed.data);
      
      const seatsToCreate = [];
      const rows = 10;
      const cols = 4;

      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          if (c === 3) continue;
          
          const isLadies = r < 3;
          seatsToCreate.push({
            showId: show.id,
            seatNumber: `L${r}${String.fromCharCode(64 + c)}`,
            deck: "lower",
            row: r,
            col: c > 2 ? c - 1 : c,
            type: isLadies ? "ladies" : "standard",
            price: isLadies ? "550" : "500",
            features: isLadies ? ["Ladies Only"] : [],
          });
        }
      }

      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= 3; c++) {
          seatsToCreate.push({
            showId: show.id,
            seatNumber: `U${r}${String.fromCharCode(64 + c)}`,
            deck: "upper",
            row: r,
            col: c,
            type: "sleeper",
            price: "800",
            features: ["Power Outlet", "Reading Light"],
          });
        }
      }

      await storage.createSeats(seatsToCreate);

      res.status(201).json(show);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shows/:id/seats", async (req, res) => {
    try {
      const showId = parseInt(req.params.id);
      const allSeats = await storage.getSeats(showId);
      const bookedSeatIds = await storage.getBookedSeatIds(showId);
      const seatGenderMap = await storage.getSeatGenderMap(showId);
      
      const seatsWithStatus = allSeats.map(seat => ({
        ...seat,
        status: bookedSeatIds.includes(seat.id) ? "booked" : "available",
        bookedGender: seatGenderMap.get(seat.id) || null,
      }));

      res.json(seatsWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shows/:id/book", async (req, res) => {
    try {
      console.log("BOOKING REQUEST BODY", { ...req.body, passenger: req.body.passenger ? { ...req.body.passenger, idNumber: "****" } : undefined });
      
      const showId = parseInt(req.params.id);
      const parsed = bookSeatsSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { seatIds, idempotencyKey, userId, passenger } = parsed.data;
      
      if (passenger) {
        const phoneDigits = passenger.phone.replace(/\D/g, "");
        if (phoneDigits.length < 10) {
          return res.status(400).json({ error: "Invalid phone number - must be 10 digits" });
        }
        passenger.phone = phoneDigits.length === 10 ? `+91${phoneDigits}` : `+${phoneDigits}`;
      }

      const existingBooking = await storage.getBookingByIdempotencyKey(idempotencyKey);
      if (existingBooking) {
        return res.json(existingBooking);
      }

      const result = await db.transaction(async (tx) => {
        const lockedSeats = await tx
          .select()
          .from(seatsTable)
          .where(inArray(seatsTable.id, seatIds))
          .for("update");

        if (lockedSeats.length !== seatIds.length) {
          throw new Error("Some seats not found");
        }

        // Check for seat locks by other users
        const activeLocks = await tx
          .select()
          .from(seatLocks)
          .where(
            and(
              sql`${seatLocks.showId} = ${showId}`,
              inArray(seatLocks.seatId, seatIds),
              gt(seatLocks.expiresAt, new Date())
            )
          );
        
        // Filter locks by other users
        const userIdStr = userId ? String(userId) : null;
        const otherUserLocks = activeLocks.filter(lock => lock.userId !== userIdStr);
        if (otherUserLocks.length > 0) {
          const lockedSeatIds = otherUserLocks.map(l => l.seatId);
          throw new Error(`Seats locked by another user: ${lockedSeatIds.join(", ")}`);
        }

        const bookedSeatIds = await tx
          .select({ seatIds: bookings.seatIds })
          .from(bookings)
          .where(
            and(
              sql`${bookings.showId} = ${showId}`,
              inArray(bookings.status, ["PENDING", "CONFIRMED"])
            )
          );

        const allBookedIds: number[] = [];
        bookedSeatIds.forEach(b => {
          if (b.seatIds) allBookedIds.push(...b.seatIds);
        });

        const conflictingSeats = seatIds.filter(id => allBookedIds.includes(id));
        if (conflictingSeats.length > 0) {
          throw new Error(`Seats already booked: ${conflictingSeats.join(", ")}`);
        }

        const totalAmount = lockedSeats.reduce((sum, seat) => sum + parseFloat(seat.price), 0);
        const expiresAt = new Date(Date.now() + 60000);

        const passengerGender = passenger?.gender?.toLowerCase() || "unknown";
        const allowedGenders = ["male", "female", "other", "unknown"];
        const normalizedGender = allowedGenders.includes(passengerGender) ? passengerGender : "unknown";

        const booking = await tx
          .insert(bookings)
          .values({
            showId,
            userId: userId ? String(userId) : null,
            seatIds,
            status: "PENDING",
            totalAmount: totalAmount.toFixed(2),
            idempotencyKey,
            passengerDetails: passenger || null,
            gender: normalizedGender,
            expiresAt,
          })
          .returning();

        // Clear any locks for seats that are now booked
        if (userIdStr) {
          await tx
            .delete(seatLocks)
            .where(
              and(
                sql`${seatLocks.showId} = ${showId}`,
                inArray(seatLocks.seatId, seatIds),
                sql`${seatLocks.userId} = ${userIdStr}`
              )
            );
        }

        return booking[0];
      });

      broadcastSeatUpdate(showId);

      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes("already booked")) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bookings/:id/confirm", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { pickupPointId, dropPointId, pickupLabel, dropLabel } = req.body;
      
      const booking = await storage.confirmBooking(id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      console.log('BOOKING CONFIRMED', booking.id);
      broadcastSeatUpdate(booking.showId);

      // Use stored passenger details from booking - ignore request payload for security
      const passengerDetails = booking.passengerDetails as any;

      // Send confirmation email if user exists and booking has seats
      if (booking.userId && booking.seatIds && booking.seatIds.length > 0) {
        try {
          const userId = parseInt(booking.userId);
          const user = await storage.getUserById(userId);
          const show = await storage.getShow(booking.showId);
          
          if (!user?.email) {
            console.log("Skipping confirmation email: no user email found for userId:", booking.userId);
          } else if (!show) {
            console.log("Skipping confirmation email: show not found for showId:", booking.showId);
          } else {
            const seats = await storage.getSeats(booking.showId);
            const bookedSeats = seats.filter(s => booking.seatIds?.includes(s.id));
            
            if (bookedSeats.length === 0) {
              console.log("Skipping confirmation email: no booked seats found");
            } else {
              await sendBookingConfirmationEmail({
                bookingId: booking.id,
                userEmail: user.email,
                tripDetails: {
                  operatorName: show.operatorName,
                  source: show.source,
                  destination: show.destination,
                  departureTime: show.departureTime.toISOString(),
                  arrivalTime: show.arrivalTime.toISOString(),
                  duration: show.duration,
                },
                seats: bookedSeats.map(s => s.seatNumber),
                pickupPoint: pickupLabel || undefined,
                dropPoint: dropLabel || undefined,
                amount: booking.totalAmount,
                currency: 'INR',
                passenger: passengerDetails || undefined,
              });
              console.log("Sent booking confirmation to", user.email, "for booking", booking.id);
            }
          }
        } catch (emailError: any) {
          console.error('Booking email failed', emailError?.message || emailError);
        }
      } else {
        console.log("Skipping confirmation email: no userId or seatIds", { userId: booking.userId, seatIds: booking.seatIds });
      }

      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const parsed = requestOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { phoneNumber } = parsed.data;

      let user = await storage.getUserByPhone(phoneNumber);
      
      if (user) {
        if (user.otpAttempts >= 3 && user.lastOtpRequestAt) {
          const timeSinceLastRequest = Date.now() - new Date(user.lastOtpRequestAt).getTime();
          if (timeSinceLastRequest < 10 * 60 * 1000) {
            return res.status(429).json({ 
              error: "Too many attempts. Please try again in 10 minutes." 
            });
          } else {
            await storage.resetOtpAttempts(phoneNumber);
          }
        }
      } else {
        // Phone-based auth is deprecated, use email-based auth instead
        // Create user with placeholder email for backward compatibility
        user = await storage.createUser({ 
          email: `${phoneNumber}@phone.nextravel.local`,
          phoneNumber, 
          otp: null, 
          otpExpiresAt: null,
          otpAttempts: 0,
          lastOtpRequestAt: null,
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

      await storage.updateUserOtp(phoneNumber, otp, expiresAt);

      console.log(`OTP for ${phoneNumber}: ${otp}`);

      res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { phoneNumber, otp } = parsed.data;

      const user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.otp || !user.otpExpiresAt) {
        return res.status(400).json({ error: "No OTP requested" });
      }

      if (new Date() > new Date(user.otpExpiresAt)) {
        return res.status(400).json({ error: "OTP expired" });
      }

      if (user.otp !== otp) {
        await storage.incrementOtpAttempts(phoneNumber);
        return res.status(400).json({ error: "Invalid OTP" });
      }

      await storage.resetOtpAttempts(phoneNumber);

      const token = jwt.sign(
        { userId: user.id, phoneNumber: user.phoneNumber },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, user: { id: user.id, phoneNumber: user.phoneNumber } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/shows/:id/seats/stream", (req, res) => {
    const showId = parseInt(req.params.id);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    sseClients.push({ showId, res });

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    req.on("close", () => {
      const index = sseClients.findIndex(c => c.res === res);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Email OTP endpoints
  app.post("/api/auth/request-otp-email", async (req, res) => {
    try {
      const parsed = requestOtpEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { email } = parsed.data;

      let user = await storage.getUserByEmail(email);
      
      if (user) {
        if (user.otpAttempts >= 3 && user.lastOtpRequestAt) {
          const timeSinceLastRequest = Date.now() - new Date(user.lastOtpRequestAt).getTime();
          if (timeSinceLastRequest < 10 * 60 * 1000) {
            return res.status(429).json({ 
              message: "Too many attempts. Please try again in 10 minutes." 
            });
          } else {
            await storage.resetOtpAttemptsByEmail(email);
          }
        }
      } else {
        user = await storage.createUserWithEmail({ 
          email, 
          otp: null, 
          otpExpiresAt: null,
          otpAttempts: 0,
          lastOtpRequestAt: null,
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

      await storage.updateUserOtpByEmail(email, otp, expiresAt);

      // Send OTP via email if SMTP is configured, otherwise log to console
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          await sendOtpEmail(email, otp);
        } catch (emailError: any) {
          console.error(`Failed to send OTP email: ${emailError.message}`);
          console.log(`📧 OTP for ${email}: ${otp} (email failed, check SMTP settings)`);
        }
      } else {
        console.log(`📧 OTP for ${email}: ${otp} (SMTP not configured)`);
      }

      res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/verify-otp-email", async (req, res) => {
    try {
      const parsed = verifyOtpEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid request" });
      }

      const { email, code } = parsed.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.otp || !user.otpExpiresAt) {
        return res.status(400).json({ message: "No OTP requested" });
      }

      if (new Date() > new Date(user.otpExpiresAt)) {
        return res.status(400).json({ message: "OTP expired" });
      }

      if (user.otp !== code) {
        await storage.incrementOtpAttemptsByEmail(email);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      await storage.resetOtpAttemptsByEmail(email);

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, user: { id: user.id, email: user.email, gender: user.gender, role: user.role || 'user' } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user gender
  app.patch("/api/users/:id/gender", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { gender } = req.body;
      
      if (!gender || !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ error: "Invalid gender. Must be male, female, or other." });
      }
      
      const user = await storage.updateUserGender(userId, gender);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("Updated gender for user", userId, "to", gender);
      res.json({ id: user.id, email: user.email, gender: user.gender });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SEAT LOCKING ENDPOINTS ============
  
  // Lock a seat (120 seconds)
  app.post("/api/shows/:showId/seats/:seatId/lock", async (req, res) => {
    try {
      const showId = parseInt(req.params.showId);
      const seatId = parseInt(req.params.seatId);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const expiresAt = new Date(Date.now() + 120 * 1000); // 120 seconds
      const lock = await storage.lockSeat(showId, seatId, String(userId), expiresAt);
      
      console.log('SEAT LOCK ATTEMPT', { showId, seatId, userId, result: lock ? 'success' : 'failed' });
      
      if (!lock) {
        const locks = await storage.getLockedSeats(showId);
        const existingLock = locks.find(l => l.seatId === seatId);
        return res.status(409).json({ 
          locked: true, 
          lockedBy: existingLock?.userId,
          expiresAt: existingLock?.expiresAt 
        });
      }
      
      // Broadcast lock update via SSE
      broadcastSeatUpdate(showId);
      
      res.json({ locked: true, expiresAt: lock.expiresAt });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unlock a seat
  app.post("/api/shows/:showId/seats/:seatId/unlock", async (req, res) => {
    try {
      const showId = parseInt(req.params.showId);
      const seatId = parseInt(req.params.seatId);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const unlocked = await storage.unlockSeat(showId, seatId, String(userId));
      
      if (!unlocked) {
        return res.status(403).json({ error: "Cannot unlock seat - not locked by you" });
      }
      
      console.log('SEAT UNLOCK', { showId, seatId, userId });
      broadcastSeatUpdate(showId);
      
      res.json({ unlocked: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all locked seats for a show
  app.get("/api/shows/:showId/locks", async (req, res) => {
    try {
      const showId = parseInt(req.params.showId);
      const locks = await storage.getLockedSeats(showId);
      
      res.json(locks.map(l => ({
        seatId: l.seatId,
        userId: l.userId.substring(0, 4) + '****', // Mask userId
        expiresAt: l.expiresAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ CANCELLATION & REFUND ENDPOINTS ============
  
  // Get user's bookings
  app.get("/api/users/:userId/bookings", async (req, res) => {
    try {
      const userId = req.params.userId;
      const bookingsData = await storage.getBookingsByUserId(userId);
      
      // Enrich with show and seat data
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          const show = await storage.getShow(booking.showId);
          const seats = await storage.getSeatsByIds(booking.seatIds || []);
          const refund = await storage.getRefundByBookingId(booking.id);
          
          return {
            ...booking,
            show,
            seats,
            refund,
          };
        })
      );
      
      res.json(enrichedBookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel a booking
  app.post("/api/bookings/:id/cancel", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.status !== "CONFIRMED") {
        return res.status(400).json({ error: "Only confirmed bookings can be cancelled" });
      }
      
      // Get show to calculate refund
      const show = await storage.getShow(booking.showId);
      if (!show) {
        return res.status(404).json({ error: "Show not found" });
      }
      
      const departureTime = new Date(show.departureTime).getTime();
      const now = Date.now();
      const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);
      
      const totalAmount = parseFloat(booking.totalAmount);
      const cancellationFee = 50;
      let refundAmount: number;
      let reason: string;
      
      if (hoursUntilDeparture < 2) {
        // Within 2 hours - non-refundable
        refundAmount = 0;
        reason = "Non-refundable (less than 2 hours before departure)";
      } else if (hoursUntilDeparture < 24) {
        // Within 24 hours - 50% refund minus fee
        refundAmount = Math.max(0, (totalAmount * 0.5) - cancellationFee);
        reason = "Partial refund (less than 24 hours before departure)";
      } else {
        // More than 24 hours - full refund minus fee
        refundAmount = Math.max(0, totalAmount - cancellationFee);
        reason = "Full refund (more than 24 hours before departure)";
      }
      
      const result = await storage.cancelBooking(bookingId, refundAmount, reason);
      
      if (!result) {
        return res.status(400).json({ error: "Failed to cancel booking" });
      }
      
      console.log('BOOKING_CANCEL', bookingId, { refundAmount, status: 'CANCELLED', reason });
      
      // Send cancellation email
      if (booking.userId) {
        try {
          const user = await storage.getUserById(parseInt(booking.userId));
          if (user?.email) {
            console.log('Cancellation email would be sent to', user.email);
          }
        } catch (emailErr) {
          console.error('Failed to send cancellation email', emailErr);
        }
      }
      
      // Notify users who requested notifications for released seats
      if (booking.seatIds && booking.seatIds.length > 0) {
        try {
          const releasedSeats = await storage.getSeatsByIds(booking.seatIds);
          for (const seat of releasedSeats) {
            // Normalize seatNumber to match how notifications are stored
            const normalizedSeatNumber = seat.seatNumber.trim().toUpperCase();
            const notifications = await storage.getPendingNotifications(booking.showId, normalizedSeatNumber);
            for (const notification of notifications) {
              try {
                await sendSeatAvailableEmail(notification.email, seat.seatNumber, show.source, show.destination);
                await storage.markNotificationSent(notification.id);
                console.log(`[notify] Sent seat available email to ${notification.email} for seat ${seat.seatNumber}`);
              } catch (emailErr) {
                console.error(`[notify] Failed to send seat available email:`, emailErr);
              }
            }
          }
        } catch (notifyErr) {
          console.error('[notify] Error processing seat notifications:', notifyErr);
        }
      }
      
      broadcastSeatUpdate(booking.showId);
      
      res.json({
        bookingId,
        status: "CANCELLED",
        refundAmount,
        reason,
        refund: result.refund,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ PDF TICKET ENDPOINT ============
  
  app.get("/api/bookings/:id/ticket", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.status !== "CONFIRMED") {
        return res.status(400).json({ error: "Ticket only available for confirmed bookings" });
      }
      
      const show = await storage.getShow(booking.showId);
      if (!show) {
        return res.status(404).json({ error: "Show not found" });
      }
      
      const seats = await storage.getSeatsByIds(booking.seatIds || []);
      const passenger = booking.passengerDetails as any;
      
      let userEmail = "guest@nextravel.com";
      if (booking.userId) {
        const user = await storage.getUserById(parseInt(booking.userId));
        if (user?.email) userEmail = user.email;
      }
      
      // Generate PDF (dynamic imports for ESM compatibility)
      const PDFDocument = (await import('pdfkit')).default;
      const QRCode = await import('qrcode');
      
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="nextravel-ticket-${bookingId}.pdf"`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(28).fillColor('#7c3aed').text('NexTravel', 50, 50);
      doc.fontSize(12).fillColor('#666').text('Your Journey Companion', 50, 85);
      
      doc.moveTo(50, 110).lineTo(545, 110).stroke('#ddd');
      
      // Booking ID
      doc.fontSize(14).fillColor('#000').text('Booking Confirmation', 50, 130);
      doc.fontSize(20).fillColor('#06b6d4').text(`#${bookingId}`, 50, 150);
      
      // Trip Details
      doc.fontSize(12).fillColor('#666').text('From', 50, 190);
      doc.fontSize(16).fillColor('#000').text(show.source, 50, 205);
      doc.fontSize(12).fillColor('#666').text('To', 300, 190);
      doc.fontSize(16).fillColor('#000').text(show.destination, 300, 205);
      
      // Date and Time
      const departureDate = new Date(show.departureTime);
      const arrivalDate = new Date(show.arrivalTime);
      
      doc.fontSize(12).fillColor('#666').text('Departure', 50, 250);
      doc.fontSize(14).fillColor('#000').text(
        departureDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        50, 265
      );
      doc.text(departureDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 50, 282);
      
      doc.fontSize(12).fillColor('#666').text('Arrival', 300, 250);
      doc.fontSize(14).fillColor('#000').text(
        arrivalDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        300, 265
      );
      doc.text(arrivalDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 300, 282);
      
      // Operator
      doc.fontSize(12).fillColor('#666').text('Operator', 50, 320);
      doc.fontSize(14).fillColor('#000').text(show.operatorName, 50, 335);
      doc.fontSize(12).fillColor('#666').text(show.vehicleType, 50, 352);
      
      // Seats
      doc.fontSize(12).fillColor('#666').text('Seats', 300, 320);
      doc.fontSize(14).fillColor('#000').text(seats.map(s => s.seatNumber).join(', '), 300, 335);
      
      // Passenger Details
      doc.moveTo(50, 380).lineTo(545, 380).stroke('#ddd');
      doc.fontSize(14).fillColor('#000').text('Passenger Details', 50, 400);
      
      if (passenger) {
        doc.fontSize(12).fillColor('#666').text('Email:', 50, 425);
        doc.fillColor('#000').text(userEmail, 120, 425);
        
        doc.fillColor('#666').text('Phone:', 50, 445);
        doc.fillColor('#000').text(passenger.phone || 'N/A', 120, 445);
        
        doc.fillColor('#666').text('ID Type:', 300, 425);
        doc.fillColor('#000').text(passenger.idType || 'N/A', 370, 425);
        
        const maskedId = passenger.idNumber?.length >= 6 
          ? passenger.idNumber.slice(0, 2) + '****' + passenger.idNumber.slice(-2)
          : '****';
        doc.fillColor('#666').text('ID Number:', 300, 445);
        doc.fillColor('#000').text(maskedId, 380, 445);
      }
      
      // Fare
      doc.moveTo(50, 480).lineTo(545, 480).stroke('#ddd');
      doc.fontSize(14).fillColor('#000').text('Total Fare', 50, 500);
      doc.fontSize(24).fillColor('#16a34a').text(`₹${booking.totalAmount}`, 50, 520);
      
      // QR Code
      const qrData = `https://nextravel.com/bookings/${bookingId}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1 });
      const qrImageData = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      doc.image(Buffer.from(qrImageData, 'base64'), 430, 490, { width: 100 });
      doc.fontSize(10).fillColor('#666').text('Scan for details', 445, 595);
      
      // Footer
      doc.moveTo(50, 640).lineTo(545, 640).stroke('#ddd');
      doc.fontSize(10).fillColor('#666').text('Thank you for traveling with NexTravel!', 50, 660);
      doc.text('For support, contact: support@nextravel.com', 50, 675);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, 690);
      
      doc.end();
      
      console.log('GENERATED PDF', bookingId);
    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ LIVE TRACKING ENDPOINTS ============
  
  const routeCoordinates: Record<number, { pickup: { lat: number; lng: number; name: string }; drop: { lat: number; lng: number; name: string }; stops: { lat: number; lng: number; name: string }[] }> = {
    1: {
      pickup: { lat: 19.0760, lng: 72.8777, name: "Mumbai Central" },
      drop: { lat: 12.9716, lng: 77.5946, name: "Bengaluru" },
      stops: [
        { lat: 18.5204, lng: 73.8567, name: "Pune" },
        { lat: 15.3173, lng: 75.7139, name: "Hubli" },
      ],
    },
    2: {
      pickup: { lat: 28.7041, lng: 77.1025, name: "Delhi" },
      drop: { lat: 26.9124, lng: 75.7873, name: "Jaipur" },
      stops: [
        { lat: 28.4595, lng: 77.0266, name: "Gurgaon" },
        { lat: 27.2046, lng: 77.4977, name: "Bharatpur" },
      ],
    },
    3: {
      pickup: { lat: 13.0827, lng: 80.2707, name: "Chennai" },
      drop: { lat: 17.3850, lng: 78.4867, name: "Hyderabad" },
      stops: [
        { lat: 14.6819, lng: 77.6006, name: "Anantapur" },
        { lat: 15.8281, lng: 78.0373, name: "Kurnool" },
      ],
    },
  };
  
  const busPositionProgress: Record<number, number> = {};
  
  app.get("/api/trips/:id/stops", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const route = routeCoordinates[tripId];
      
      if (!route) {
        return res.json([]);
      }
      
      console.log("[api] getTripStops success for trip", tripId);
      res.json(route.stops);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/trips/:id/route", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const route = routeCoordinates[tripId];
      
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      
      res.json(route);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/track/:tripId/positions", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const route = routeCoordinates[tripId];
      
      if (!route) {
        return res.json({ tripId: tripId.toString(), positions: [] });
      }
      
      if (!busPositionProgress[tripId]) {
        busPositionProgress[tripId] = 0;
      }
      
      busPositionProgress[tripId] += 0.02;
      if (busPositionProgress[tripId] > 1) {
        busPositionProgress[tripId] = 0;
      }
      
      const progress = busPositionProgress[tripId];
      
      const allPoints = [route.pickup, ...route.stops, route.drop];
      const totalSegments = allPoints.length - 1;
      const segmentProgress = progress * totalSegments;
      const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
      const segmentFraction = segmentProgress - segmentIndex;
      
      const startPoint = allPoints[segmentIndex];
      const endPoint = allPoints[segmentIndex + 1];
      
      const currentLat = startPoint.lat + (endPoint.lat - startPoint.lat) * segmentFraction;
      const currentLng = startPoint.lng + (endPoint.lng - startPoint.lng) * segmentFraction;
      
      const position = {
        lat: currentLat,
        lng: currentLng,
        ts: Date.now(),
      };
      
      console.log("[track] Position update for trip", tripId, position);
      
      res.json({
        tripId: tripId.toString(),
        positions: [position],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SEAT NOTIFICATION ENDPOINT ============
  
  app.post("/api/notify-seat", async (req, res) => {
    try {
      const parsed = notifySeatSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { showId, email } = parsed.data;
      // Normalize seatNumber: trim whitespace and convert to uppercase
      const seatNumber = parsed.data.seatNumber.trim().toUpperCase();
      
      // Check for existing pending notification for this email/seat combo
      const existingNotifications = await storage.getPendingNotifications(showId, seatNumber);
      const alreadySubscribed = existingNotifications.some(n => n.email.toLowerCase() === email.toLowerCase());
      
      if (alreadySubscribed) {
        return res.json({ success: true, message: "You're already signed up to be notified for this seat." });
      }
      
      await storage.createSeatNotification({
        showId,
        seatNumber,
        email: email.toLowerCase(),
        notified: "false",
      });
      
      console.log(`[notify] Saved notification request for seat ${seatNumber} on show ${showId} to ${email}`);
      
      res.json({ success: true, message: "Notification request saved. We'll email you when this seat becomes free." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ REDIS DEBUG ENDPOINT ============
  
  app.get("/api/debug/redis-ping", async (req, res) => {
    try {
      if (!redis) {
        return res.status(503).json({ error: "Redis not configured", pong: null });
      }
      const pong = await redis.ping();
      console.log('[redis] Ping successful:', pong);
      res.json({ pong });
    } catch (error: any) {
      console.error('[redis] Ping failed:', error.message);
      res.status(500).json({ error: error.message, pong: null });
    }
  });

  return httpServer;
}
