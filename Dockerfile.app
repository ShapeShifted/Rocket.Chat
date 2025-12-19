FROM node:22.16.0-alpine3.21 AS builder

LABEL maintainer="you@example.com"

ENV LANG=C.UTF-8
WORKDIR /app

# System deps commonly required to build native modules
RUN apk add --no-cache python3 make g++ git curl bash

# Copy minimal files first to maximize layer caching
COPY package.json yarn.lock .yarnrc.yml ./

# Prepare Corepack + install dependencies at build time
RUN corepack enable && corepack prepare yarn@stable --activate
RUN yarn install --immutable --network-timeout 600000 || yarn install --network-timeout 600000

# Copy source and build
COPY . .
RUN yarn build

FROM node:22.16.0-alpine3.21 AS final
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000

# Copy built application from builder stage
COPY --from=builder /app /app

# Add lightweight entrypoint (no install/build at container start)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["yarn", "dsv"]