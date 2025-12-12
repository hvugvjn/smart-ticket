# Smart Ticket - Server

An Express + Node.js backend for the Smart Ticket application.

## Installation

```bash
npm install
```

## Running Locally

1. Create a `.env` file based on `.env.example`.
   ```bash
   cp .env.example .env
   ```
2. Run migrations:
   ```bash
   npm run db:push
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

See `.env.example` for required variables.

## Deployment (Render/Railway)

1. Connect your repository.
2. Set "Root Directory" to `server`.
3. Set build command: `npm install && npm run build`.
4. Set start command: `npm start`.
5. Add environment variables.
