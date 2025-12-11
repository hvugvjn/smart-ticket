# NexTravel - Level-5 Intelligent Ticket Booking Platform

A next-generation ticket booking platform with real-time seat selection, intelligent recommendations, and high-concurrency booking engine built with React, Express, and PostgreSQL.

## 🎯 Features

### Core Functionality
- **Real-Time Seat Availability** - SSE (Server-Sent Events) for live seat updates
- **Seat Locking Mechanism** - 60-second temporary hold with automatic expiry
- **High-Concurrency Booking** - PostgreSQL transactions with `SELECT FOR UPDATE` row locking
- **OTP Authentication** - Mobile phone verification with rate limiting (3 attempts / 10 minutes)
- **Idempotency Keys** - Prevents duplicate bookings on retry
- **Automatic Expiry Worker** - Background process to expire pending bookings

### UI/UX Excellence
- **Dark Future Aesthetic** - Electric cyan accents with glassmorphism
- **Framer Motion Animations** - Smooth transitions and micro-interactions
- **Responsive Seat Map** - Dual-deck visualization (Lower/Upper decks)
- **Real-Time Updates** - Instant feedback on seat availability changes
- **Smart Search** - Filter trips by route, time, and amenities

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Home      │  │    Admin     │  │  Seat Map    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    TanStack Query                           │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/SSE
┌────────────────────────────┼─────────────────────────────────┐
│                    Backend (Express)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routes                          │  │
│  │  /api/shows                                           │  │
│  │  /api/shows/:id/seats (GET + SSE Stream)            │  │
│  │  /api/shows/:id/book (POST with Transaction)        │  │
│  │  /api/auth/request-otp                               │  │
│  │  /api/auth/verify-otp                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                   Storage Interface                         │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Expiry Worker                            │  │
│  │  (Every 10s: Expire PENDING bookings > 60s)         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                  PostgreSQL Database                         │
│  ┌───────┐  ┌───────┐  ┌──────────┐  ┌───────┐            │
│  │ shows │  │ seats │  │ bookings │  │ users │            │
│  └───────┘  └───────┘  └──────────┘  └───────┘            │
└──────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Shows Table
```sql
- id (serial, PK)
- operatorName (text)
- source (text)
- destination (text)
- departureTime (timestamp)
- arrivalTime (timestamp)
- duration (text)
- price (decimal)
- vehicleType (text)
- rating (decimal)
- totalSeats (integer)
- amenities (text[])
```

### Seats Table
```sql
- id (serial, PK)
- showId (integer, FK → shows.id)
- seatNumber (text)
- deck ('lower' | 'upper')
- row (integer)
- col (integer)
- type ('standard' | 'sleeper' | 'ladies' | 'xl')
- price (decimal)
- features (text[])
```

### Bookings Table
```sql
- id (serial, PK)
- showId (integer, FK → shows.id)
- userId (text, nullable)
- seatIds (integer[])
- status ('PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED')
- totalAmount (decimal)
- idempotencyKey (text, unique)
- expiresAt (timestamp, nullable)
- confirmedAt (timestamp, nullable)
- createdAt (timestamp)
```

### Users Table
```sql
- id (serial, PK)
- phoneNumber (text, unique)
- otp (text, nullable)
- otpExpiresAt (timestamp, nullable)
- otpAttempts (integer, default 0)
- lastOtpRequestAt (timestamp, nullable)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (automatically provisioned in Replit)

### Installation

```bash
# Install dependencies (already done)
npm install

# Push database schema
npm run db:push

# Seed sample data
tsx server/seed.ts
```

### Run Development Server

```bash
npm run dev
```

Server runs on: `http://localhost:5000`

## 🔑 API Endpoints

### Shows
- `GET /api/shows` - Get all available shows
- `GET /api/shows/:id` - Get show by ID
- `POST /api/admin/shows` - Create new show with auto-generated seats
- `GET /api/shows/:id/seats` - Get all seats with availability status
- `GET /api/shows/:id/seats/stream` - SSE endpoint for real-time seat updates

### Booking
- `POST /api/shows/:id/book` - Book seats (requires idempotencyKey)
  - Uses PostgreSQL transaction
  - `SELECT FOR UPDATE` prevents race conditions
  - Creates PENDING booking with 60s expiry
- `POST /api/bookings/:id/confirm` - Confirm a pending booking

### Authentication
- `POST /api/auth/request-otp` - Request OTP code
  - Rate limit: 3 attempts per 10 minutes
  - OTP expires in 3 minutes
  - Check server logs for OTP code
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token

## 🧪 Testing with Postman

Import the provided `postman_collection.json` into Postman.

### Environment Variables
Set `base_url` to: `http://localhost:5000`

### Test Scenarios

#### 1. Normal Booking Flow
1. Get Shows → `GET /api/shows`
2. Get Seats → `GET /api/shows/1/seats`
3. Book Seats → `POST /api/shows/1/book`
4. Request OTP → `POST /api/auth/request-otp`
5. Check server logs for OTP
6. Verify OTP → `POST /api/auth/verify-otp`
7. Confirm Booking → `POST /api/bookings/:id/confirm`

#### 2. Concurrency Test
1. Open two Postman tabs
2. Send "Concurrent Booking - User 1" for seat ID 5
3. Immediately send "Concurrent Booking - User 2" for same seat
4. **Expected**: One succeeds with 201, other fails with 409 Conflict

#### 3. Idempotency Test
1. Book seats with idempotencyKey: `test-key-123`
2. Retry same request with same key
3. **Expected**: Both return same booking (no duplicate)

#### 4. Expiry Test
1. Book seats
2. Wait 60+ seconds
3. Check seat availability
4. **Expected**: Booking status changes to EXPIRED, seats become available

## 🎨 Frontend Pages

### Home (`/`)
- Hero section with search
- List of available trips
- Click "View Seats" to open booking modal
- Real-time seat map with live updates
- OTP verification flow
- Booking confirmation

### Admin (`/admin`)
- Create new shows
- View all shows
- Shows automatically get 60 seats generated:
  - Lower deck: 30 seats (2+2 layout, first 2 rows ladies-only)
  - Upper deck: 30 sleeper seats (1+2 layout)

## 🔐 Security Features

### OTP Authentication
- 4-digit random code
- 3-minute expiry
- Rate limiting (3 attempts / 10 minutes)
- JWT token generation on verification

### Booking Security
- Row-level locking (`SELECT FOR UPDATE`)
- Idempotency keys prevent duplicates
- Transaction isolation prevents race conditions
- Automatic expiry of abandoned bookings

## ⚡ Performance Optimizations

### Backend
- Database connection pooling
- Transaction-based seat locking
- Efficient array operations for seat IDs
- Background worker for expiry (10s interval)

### Frontend
- TanStack Query for caching
- Real-time updates via SSE
- Optimistic UI updates
- Lazy loading with React.lazy (if needed)

## 📁 Project Structure

```
.
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.tsx
│   │   │   ├── modules/
│   │   │   │   ├── SearchHero.tsx
│   │   │   │   └── SeatMapConnected.tsx
│   │   │   └── ui/ (shadcn components)
│   │   ├── lib/
│   │   │   └── api.ts (API client)
│   │   ├── pages/
│   │   │   ├── home-connected.tsx
│   │   │   └── admin-connected.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── server/
│   ├── db.ts (Drizzle connection)
│   ├── storage.ts (Storage interface + PostgreSQL implementation)
│   ├── routes.ts (API routes)
│   ├── expiry-worker.ts (Background expiry job)
│   ├── seed.ts (Sample data seeder)
│   └── index.ts (Express server)
├── shared/
│   └── schema.ts (Drizzle schemas + Zod validation)
├── postman_collection.json
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing
- **Framer Motion** - Animations
- **Tailwind CSS v4** - Styling
- **Shadcn UI** - Component library
- **Lucide React** - Icons

### Backend
- **Node.js + Express** - Server framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe SQL
- **Zod** - Schema validation
- **jsonwebtoken** - JWT authentication
- **Server-Sent Events** - Real-time updates

## 🔥 Key Implementation Details

### Booking Transaction Logic
```typescript
const result = await db.transaction(async (tx) => {
  // 1. Lock seats for this transaction
  const lockedSeats = await tx
    .select()
    .from(seatsTable)
    .where(inArray(seatsTable.id, seatIds))
    .for("update"); // Row-level lock

  // 2. Check if seats are already booked
  const bookedSeatIds = await tx
    .select({ seatIds: bookings.seatIds })
    .from(bookings)
    .where(
      and(
        sql`${bookings.showId} = ${showId}`,
        inArray(bookings.status, ["PENDING", "CONFIRMED"])
      )
    );

  // 3. Validate no conflicts
  const conflictingSeats = seatIds.filter(id => 
    allBookedIds.includes(id)
  );
  
  if (conflictingSeats.length > 0) {
    throw new Error(`Seats already booked: ${conflictingSeats.join(", ")}`);
  }

  // 4. Create PENDING booking with 60s expiry
  const booking = await tx
    .insert(bookings)
    .values({
      showId,
      seatIds,
      status: "PENDING",
      totalAmount,
      idempotencyKey,
      expiresAt: new Date(Date.now() + 60000),
    })
    .returning();

  return booking[0];
});
```

### Real-Time Updates with SSE
```typescript
// Backend
app.get("/api/shows/:id/seats/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  
  sseClients.push({ showId, res });
  
  // Broadcast on booking changes
  function broadcastSeatUpdate(showId) {
    sseClients
      .filter(client => client.showId === showId)
      .forEach(client => {
        client.res.write(`data: ${JSON.stringify({ type: "seat_update" })}\n\n`);
      });
  }
});

// Frontend
useEffect(() => {
  const eventSource = new EventSource(\`/api/shows/\${showId}/seats/stream\`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "seat_update") {
      refetch(); // Refresh seat availability
    }
  };

  return () => eventSource.close();
}, [showId]);
```

## 📈 Scalability Considerations

### Current Implementation
- Single PostgreSQL instance
- In-memory SSE client tracking
- 10-second expiry worker interval

### Future Improvements
- **Redis** for distributed seat locking
- **WebSockets** for bidirectional real-time communication
- **Queue system** (Bull/BullMQ) for booking processing
- **Database read replicas** for scalability
- **CDN** for static assets
- **Horizontal scaling** with session affinity for SSE

## 📝 Notes

- OTP codes are logged to server console (check logs after requesting OTP)
- Default phone number in UI: `+15551234599`
- Seed script creates 3 sample shows with 60 seats each
- All bookings expire after 60 seconds if not confirmed
- Expiry worker runs every 10 seconds

## 🎯 Testing Checklist

- ✅ Create show via admin panel
- ✅ View shows on home page
- ✅ Select seats on seat map
- ✅ Book seats (creates PENDING booking)
- ✅ Request OTP
- ✅ Verify OTP with correct code
- ✅ Confirm booking (PENDING → CONFIRMED)
- ✅ Test concurrent bookings (one fails with 409)
- ✅ Test idempotency (retry returns same booking)
- ✅ Test expiry (wait 60s, seat becomes available)
- ✅ SSE updates (book in one tab, see update in another)

## 🚀 Deployment

For production deployment:
1. Set `JWT_SECRET` environment variable
2. Configure production DATABASE_URL
3. Run `npm run build`
4. Run `npm start`
5. Set up Redis for distributed locking
6. Configure CORS for production domains
7. Add rate limiting middleware
8. Set up monitoring and logging

---

**Built with** ⚡ by the NexTravel Team
