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
