#!/bin/bash

COMMAND="${@:-0}"

echo "Waiting for app-database to become available..."
wait-for --timeout 30 $NITRO_DATABASE_APP_HOST:${NITRO_DATABASE_APP_PORT:-5432}

echo "Waiting for osm-sync-database to become available..."
wait-for --timeout 30 $NITRO_DATABASE_OSM_SYNC_HOST:${NITRO_DATABASE_OSM_SYNC_PORT:-5432}

if [ "$COMMAND" == "worker" ]; then
  npm run start:worker

elif [ "$COMMAND" == "server" ]; then
  npm run db:migrate
  npm run start:server

else
  echo "Wrong command specified. Use either 'worker' or 'server'"
  exit 1
fi

exit 0
