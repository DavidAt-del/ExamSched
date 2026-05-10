FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
# Skip lifecycle scripts: @app/shared's `prepare` script runs tsc and its
# sources aren't copied yet. Explicit shared build follows in the next stage.
RUN npm ci --workspaces --include-workspace-root --no-audit --no-fund --ignore-scripts

FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm --workspace @app/shared run build
# `npm ci --ignore-scripts` above skipped sharp's postinstall, which downloads
# the platform-specific native binary. Run rebuild now that we know we want it.
RUN npm --workspace @app/web rebuild sharp
RUN npm --workspace @app/web run build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
