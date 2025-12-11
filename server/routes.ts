import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sendOtpEmail } from "./lib/mail";
import { sendBookingConfirmationEmail } from "./lib/booking-email";
import { 
  bookSeatsSchema, 
  requestOtpSchema, 
  verifyOtpSchema,
  requestOtpEmailSchema,
  verifyOtpEmailSchema,
  insertShowSchema,
  type BookSeatsRequest,
  bookings,
  seats as seatsTable,
  users,
} from "@shared/schema";
import { sql, inArray, and } from "drizzle-orm";
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

  app.post("/api/admin/shows", async (req, res) => {
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
      
      const seatsWithStatus = allSeats.map(seat => ({
        ...seat,
        status: bookedSeatIds.includes(seat.id) ? "booked" : "available",
      }));

      res.json(seatsWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shows/:id/book", async (req, res) => {
    try {
      const showId = parseInt(req.params.id);
      const parsed = bookSeatsSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { seatIds, idempotencyKey, userId } = parsed.data;

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

        const booking = await tx
          .insert(bookings)
          .values({
            showId,
            userId: userId ? String(userId) : null,
            seatIds,
            status: "PENDING",
            totalAmount: totalAmount.toFixed(2),
            idempotencyKey,
            expiresAt,
          })
          .returning();

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
              });
              console.log("Sent booking confirmation to", user.email);
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

  return httpServer;
}
