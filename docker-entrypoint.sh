#!/bin/sh
set -e

# ensure .env exists
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

# enable official yarn via corepack (so `yarn` is available if needed)
corepack enable
corepack prepare yarn@stable --activate

# run the main command (default: yarn dsv)
exec "$@"