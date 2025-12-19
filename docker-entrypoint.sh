#!/bin/sh
set -e

# ensure .env exists
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

# enable official yarn via corepack
corepack enable
corepack prepare yarn@stable --activate
yarn --version

# install and build (allow fallback if immutable fails)
yarn install --network-timeout 600000 || yarn install --immutable=false --network-timeout 600000
yarn build

# run the main command (default: yarn dsv)
exec "$@"