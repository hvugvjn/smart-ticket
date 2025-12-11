# NexTravel - Intelligent Ticket Booking Platform

## Overview

NexTravel is a next-generation ticket booking platform built to deliver a superior booking experience compared to existing travel apps. The system features real-time seat selection with WebSocket updates, OTP-based mobile authentication, intelligent seat recommendations, and a high-concurrency booking engine designed to handle 200+ simultaneous booking attempts correctly.

The platform targets bus/travel ticket bookings with features like live seat availability, automatic seat locking with countdown timers, and an admin dashboard for operational management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite bundler
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Animations**: Framer Motion for seat selection and booking flow animations

The frontend follows a component-based architecture with:
- `/components/ui/` - Reusable shadcn/ui components
- `/components/layout/` - Layout components (Navbar)
- `/components/modules/` - Feature-specific components (SeatMap, SearchHero)
- `/pages/` - Route-level page components
- `/lib/` - Utilities, API client, and query configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful endpoints under `/api/`
- **Real-time**: Server-Sent Events (SSE) for live seat availability updates

Key backend modules:
- `server/routes.ts` - API route definitions with JWT authentication
- `server/storage.ts` - Data access layer implementing IStorage interface
- `server/db.ts` - PostgreSQL connection using node-postgres pool
- `server/expiry-worker.ts` - Background worker for expiring pending bookings

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync

Core database tables:
- `shows` - Travel/bus trip listings with operator info, pricing, amenities
- `seats` - Seat inventory per show with deck, row, column, type, and pricing
- `bookings` - Booking records with status (pending/confirmed/expired), idempotency keys
- `users` - User accounts with phone number and OTP verification fields

### Authentication
- **Method**: Mobile OTP (4-6 digit codes)
- **Token**: JWT stored in HttpOnly cookies
- **Rate Limiting**: 3 OTP attempts per 10 minutes with cooldown
- **OTP Expiry**: 2-3 minutes

### High-Concurrency Booking
The booking engine uses:
- PostgreSQL transaction isolation for atomic operations
- `SELECT ... FOR UPDATE` row locking on seats
- Idempotency keys to prevent duplicate bookings
- 60-second seat locks with automatic expiration via background worker

### Build System
- **Development**: Vite dev server with HMR on port 5000
- **Production**: Custom build script using esbuild for server, Vite for client
- **Output**: `dist/` directory with `index.cjs` (server) and `public/` (client assets)

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe queries and schema management

### Third-Party Libraries
- `jsonwebtoken` - JWT token generation and verification
- `connect-pg-simple` - PostgreSQL session store for Express
- `date-fns` - Date manipulation utilities
- `zod` - Runtime schema validation (integrated with Drizzle via drizzle-zod)

### Frontend Libraries
- `@tanstack/react-query` - Server state management and caching
- `recharts` - Admin dashboard charts and analytics
- `framer-motion` - UI animations
- Full Radix UI primitive suite via shadcn/ui

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (defaults to development value if not set)