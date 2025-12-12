FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json .

# Copy server package files
COPY server/package.json server/
COPY server/tsconfig.json server/

# Install dependencies
WORKDIR /app/server
RUN npm install

# Copy source code
COPY server/ .

# Build
RUN npm run build

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
