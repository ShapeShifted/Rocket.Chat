FROM node:22.16.0-alpine3.21

LABEL maintainer="you@example.com"

ENV LANG=C.UTF-8
WORKDIR /app

# System deps commonly required to build native modules
RUN apk add --no-cache python3 make g++ git curl bash

# Copy minimal files first to maximize layer caching (if present)
# These COPYs are permissive ¡ª build will continue if some files are missing.
COPY package.json yarn.lock .yarnrc.yml .yarn/ .yarn/plugins/ .yarn/releases/ .yarn/patches/ ./
# Copy the rest of the repository
COPY . .

# Add entrypoint that performs env setup, installs, builds and starts the app
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["yarn", "dsv"]