FROM node:18-alpine

WORKDIR /app

# Copy root package files (if any config needs shared)
# COPY package.json . 

# Copy server package files
COPY server/package.json server/
COPY server/tsconfig.json server/

# Install dependencies (using npm ci for speed/consistency)
WORKDIR /app/server
RUN npm install

# Copy source code
COPY server/ .

# Build
RUN npm run build

# Expose port
EXPOSE 10000

# Start command
CMD ["npm", "start"]
