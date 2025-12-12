# Smart Ticket - Client

A React + Vite frontend for the Smart Ticket application.

## Installation

```bash
npm install
```

## Running Locally

1. Create a `.env` file based on `.env.example`.
   ```bash
   cp .env.example .env
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

## Environment Variables

- `VITE_API_BASE_URL`: URL of the backend API (e.g., `http://localhost:5000` or production URL).

## Deployment (Vercel)

1. Connect your repository to Vercel.
2. Set the "Root Directory" to `client`.
3. Add environment variables in Vercel settings.
4. Deploy.
