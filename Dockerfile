FROM oven/bun:1.2.22-slim AS base
WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

FROM base AS install

# install all dependencies into tmp directory this will cache them and speed up future builds
RUN mkdir -p /tmp/dev/
COPY package.json bun.lock /tmp/dev/
RUN cd /tmp/dev/ && bun install --frozen-lockfile

# install prod dependencies into different directory
RUN mkdir -p /tmp/prod/
COPY package.json bun.lock /tmp/prod/
RUN cd /tmp/prod && bun install --ignore-scripts --frozen-lockfile --production

FROM base AS build

# get all dev dependencies as well as the source and build the app
ENV NODE_ENV=production
COPY --from=install /tmp/dev/node_modules node_modules
COPY . .
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install --chown=bun:bun /tmp/prod/node_modules node_modules
COPY --from=build --chown=bun:bun /app/.output .
COPY --from=build --chown=bun:bun /app/package.json .
COPY --from=build --chown=bun:bun /app/drizzle.config.ts .
COPY --from=build --chown=bun:bun /app/src/server/db/migrations ./src/server/db/migrations
COPY --from=build --chown=bun:bun /app/src/server/db/schema/app ./src/server/db/schema/app

# run the app
USER bun
EXPOSE 3000/tcp
CMD [ "bun", "run", "./server/index.mjs" ]

# check if the app is healthy
HEALTHCHECK --interval=10s --timeout=3s --retries=1 --start-period=10s \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
