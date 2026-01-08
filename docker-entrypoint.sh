#!/bin/bash

COMMAND="${@:-0}"

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
