#!/usr/bin/env bash

timeout=60
interval=2
elapsed=0

echo "waiting for server container to become healthy (timeout: ${timeout}s)..."
docker compose -f docker-compose.ci.yml logs -f &

while true; do

  # get container ID of the server container
  cid="$(docker compose -f docker-compose.ci.yml ps -q server)"

  # get health status of the server container
  status="$( [ -n "$cid" ] && docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "starting")"
  if [ "$status" = "healthy" ]; then
    echo "server container is healthy"
    break
  fi
  if [ $elapsed -ge $timeout ]; then
    echo "server container did not become healthy within ${timeout}s" >&2
    exit 1
  fi
  sleep $interval
  elapsed=$((elapsed + interval))
done
