FROM node:22-slim

WORKDIR /app

# Install dependencies cleanly using lockfile
COPY package*.json ./
RUN npm ci

# Copy application source and build Vite frontend bundle
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Express server reads process.env.PORT (defaults to 3000)
CMD ["npm", "start"]
