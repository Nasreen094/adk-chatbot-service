FROM node:18-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy app source code
COPY . .

# Fix: Ensure dev server can write to .next directory
RUN mkdir -p /app/.next && chown -R node:node /app

# Use non-root user for safety
USER node

# Environment setup
ENV PORT=8080
ENV BASE_URL=http://localhost:$PORT

EXPOSE $PORT

# Start the app in dev mode
CMD ["sh", "-c", "npm run dev"]
