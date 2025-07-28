#!/bin/sh

bun run db:migrate

exec $@
