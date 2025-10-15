ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /app

COPY package*.json ./

# Disable Husky during Docker builds (no Git hooks in container)
ENV HUSKY=0

# Disable lifecycle hooks
ENV npm_config_lifecycle=false


# Development stage
FROM base AS development

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# Build stage
FROM base AS build

RUN npm install -g @nestjs/cli

RUN npm ci --omit=dev --ignore-scripts

COPY . .

# Generate Prisma client (required for build + runtime)
RUN npx prisma generate --schema=prisma/schema.prisma

RUN npm run build

# Production stage
FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /app

# Disable Husky during Docker builds (no Git hooks in container)
ENV HUSKY=0

# Disable lifecycle hooks
ENV npm_config_lifecycle=false

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

# Copy dist and prisma-related files
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/generated ./generated

COPY prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]