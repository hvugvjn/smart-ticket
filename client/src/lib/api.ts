const API_BASE = "/api";

export interface Show {
  id: number;
  operatorName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  vehicleType: string;
  rating: string;
  totalSeats: number;
  amenities: string[];
}

export interface Seat {
  id: number;
  showId: number;
  seatNumber: string;
  deck: string;
  row: number;
  col: number;
  type: string;
  classType: "ECONOMY" | "BUSINESS";
  price: string;
  features: string[];
  status?: "available" | "booked" | "pending";
  bookedGender?: "male" | "female" | "other" | "unknown" | null;
}

export interface Booking {
  id: number;
  showId: number;
  userId: string | null;
  seatIds: number[];
  status: string;
  totalAmount: string;
  idempotencyKey: string;
  expiresAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  passengerDetails?: any;
}

export interface SeatLock {
  seatId: number;
  userId: string;
  expiresAt: string;
}

export interface Refund {
  id: number;
  bookingId: number;
  amount: string;
  currency: string;
  status: string;
  reason: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface EnrichedBooking extends Booking {
  show?: Show;
  seats?: Seat[];
  refund?: Refund;
}

export const api = {
  async getShows(): Promise<Show[]> {
    const res = await fetch(`${API_BASE}/shows`);
    if (!res.ok) throw new Error("Failed to fetch shows");
    return res.json();
  },

  async getShow(id: number): Promise<Show> {
    const res = await fetch(`${API_BASE}/shows/${id}`);
    if (!res.ok) throw new Error("Failed to fetch show");
    return res.json();
  },

  async getSeats(showId: number): Promise<Seat[]> {
    const res = await fetch(`${API_BASE}/shows/${showId}/seats`);
    if (!res.ok) throw new Error("Failed to fetch seats");
    return res.json();
  },

  async bookSeats(showId: number, seatIds: number[], idempotencyKey: string, userId?: number, passenger?: { gender: string; phone: string; idType: string; idNumber: string }): Promise<Booking> {
    const res = await fetch(`${API_BASE}/shows/${showId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatIds, idempotencyKey, userId, passenger }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to book seats");
    }
    return res.json();
  },

  async confirmBooking(bookingId: number, options?: { pickupPointId?: string; dropPointId?: string; pickupLabel?: string; dropLabel?: string; passenger?: { gender: string; phone: string; idType: string; idNumber: string } }): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) throw new Error("Failed to confirm booking");
    return res.json();
  },

  async requestOtp(phoneNumber: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to request OTP");
    }
    return res.json();
  },

  async verifyOtp(phoneNumber: string, otp: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to verify OTP");
    }
    return res.json();
  },

  createEventSource(showId: number): EventSource {
    return new EventSource(`${API_BASE}/shows/${showId}/seats/stream`);
  },

  // Seat locking
  async lockSeat(showId: number, seatId: number, userId: string): Promise<{ locked: boolean; expiresAt?: string }> {
    const res = await fetch(`${API_BASE}/shows/${showId}/seats/${seatId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async unlockSeat(showId: number, seatId: number, userId: string): Promise<{ unlocked: boolean }> {
    const res = await fetch(`${API_BASE}/shows/${showId}/seats/${seatId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async getLockedSeats(showId: number): Promise<SeatLock[]> {
    const res = await fetch(`${API_BASE}/shows/${showId}/locks`);
    if (!res.ok) return [];
    return res.json();
  },

  // User bookings
  async getUserBookings(userId: string): Promise<EnrichedBooking[]> {
    const res = await fetch(`${API_BASE}/users/${userId}/bookings`);
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
  },

  // Cancellation
  async cancelBooking(bookingId: number): Promise<{ bookingId: number; status: string; refundAmount: number; reason: string; refund: Refund }> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to cancel booking");
    }
    return res.json();
  },

  // Download ticket PDF
  getTicketUrl(bookingId: number): string {
    return `${API_BASE}/bookings/${bookingId}/ticket`;
  },

  // Live tracking
  async getTripStops(tripId: number): Promise<Array<{ lat: number; lng: number; name: string }>> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/stops`);
      if (!res.ok) throw new Error("Failed to fetch stops");
      const data = await res.json();
      console.log("[api] getTripStops success:", data);
      return data;
    } catch (error) {
      console.log("[api] getTripStops fallback to mock data");
      return [];
    }
  },

  async getTripRoute(tripId: number): Promise<{ pickup: { lat: number; lng: number; name: string }; drop: { lat: number; lng: number; name: string }; stops: { lat: number; lng: number; name: string }[] } | null> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/route`);
      if (!res.ok) throw new Error("Failed to fetch route");
      const data = await res.json();
      console.log("[api] getTripRoute success:", data);
      return data;
    } catch (error) {
      console.log("[api] getTripRoute error:", error);
      return null;
    }
  },

  async getLivePosition(tripId: number): Promise<{ lat: number; lng: number; ts: number } | null> {
    try {
      const res = await fetch(`${API_BASE}/track/${tripId}/positions`);
      if (!res.ok) throw new Error("Failed to fetch position");
      const data = await res.json();
      if (data.positions && data.positions.length > 0) {
        return data.positions[data.positions.length - 1];
      }
      return null;
    } catch (error) {
      console.error("[api] getLivePosition error:", error);
      return null;
    }
  },

  // Seat notifications
  async notifySeat(showId: number, seatNumber: string, email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/notify-seat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId, seatNumber, email }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to save notification");
    }
    return res.json();
  },
};
