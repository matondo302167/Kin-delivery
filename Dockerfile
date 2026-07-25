# Multi-stage Dockerfile: build everything, then serve from Node server

# --- build stage -----------------------------------------------------------
FROM node:20-slim AS build
WORKDIR /app

# install deps for build
COPY package.json package-lock.json* ./
# use Debian-slim base so native optional binaries (rollup, etc.) install correctly
# prefer `npm ci` for reproducible installs
RUN npm ci

# copy source and run the project build (script/build.ts builds the client + server)
COPY . .
RUN npm run build

# --- production server (serves both API and frontend assets) ---------------
FROM node:18-slim

WORKDIR /app
ENV NODE_ENV=production

# copy built artifacts and install only production deps
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json* ./
RUN npm ci --only=production --silent || true

EXPOSE 5000
CMD ["node", "dist/index.cjs"]


