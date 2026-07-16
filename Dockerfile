# Multi-stage Dockerfile that builds the repo (client+server) and produces
# two runtime images via build targets: `server` and `client`.

# --- build stage -----------------------------------------------------------
FROM node:18-alpine AS build
WORKDIR /app

# install deps for build
COPY package.json package-lock.json* ./
RUN npm ci --silent

# copy source and run the project build (script/build.ts builds the client)
COPY . .
RUN npm run build

# --- server runtime -------------------------------------------------------
FROM node:18-alpine AS server
WORKDIR /app
ENV NODE_ENV=production

# copy built artifacts and install only production deps
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json* ./
RUN npm ci --only=production --silent || true

EXPOSE 5000
CMD ["node", "dist/index.cjs"]

# --- client runtime (nginx) -----------------------------------------------
FROM nginx:stable-alpine AS client

# copy a lightweight nginx config that supports SPA history API fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/public /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

