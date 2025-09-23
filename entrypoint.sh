#!/bin/sh

env
bun run --verbose db:migrate

exec $@
