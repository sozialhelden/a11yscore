#!/bin/bash

COMMAND="${@:-0}"

if [ "$COMMAND" == "worker" ]; then
  bun run ./src/server/queue/worker.ts

elif [ "$COMMAND" == "server" ]; then
  bun run db:migrate
  bun run ./server/index.mjs

else
  echo "Wrong command specified. Use either 'worker' or 'server'"
  exit 1
fi

exit 0
