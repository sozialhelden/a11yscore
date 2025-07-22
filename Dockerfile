FROM oven/bun:1.2.19-slim AS base
WORKDIR /app

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

# run the app
USER bun
EXPOSE 3000/tcp
CMD [ "bun", "run", "./server/index.mjs" ]
