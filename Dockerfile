FROM node:24.13.1-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl bash
RUN curl -o /usr/local/bin/wait-for https://raw.githubusercontent.com/eficode/wait-for/v2.2.3/wait-for \
    && chmod +x /usr/local/bin/wait-for

COPY ./docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

FROM base AS install

# install all dependencies into tmp directory this will cache them and speed up future builds
RUN mkdir -p /tmp/dev/
COPY package.json package-lock.json /tmp/dev/
RUN cd /tmp/dev/ && npm ci

# install prod dependencies into different directory
RUN mkdir -p /tmp/prod/
COPY package.json package-lock.json /tmp/prod/
RUN cd /tmp/prod && npm ci --omit=dev --ignore-scripts

FROM base AS build

# get all dev dependencies as well as the source and build the app
ENV NODE_ENV=production
COPY --from=install /tmp/dev/node_modules node_modules
COPY . .
RUN npm run build

FROM base AS release

# copy production dependencies and source code into final image
COPY --from=install /tmp/prod/node_modules node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .
COPY --from=build /app/drizzle.config.ts .
COPY --from=build /app/vitest.config.ts .
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/.nitro/types ./.nitro/types

# run the app
EXPOSE 3000/tcp
CMD [ "server" ]

# check if the app is healthy
HEALTHCHECK --interval=10s --timeout=3s --retries=1 --start-period=10s \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
