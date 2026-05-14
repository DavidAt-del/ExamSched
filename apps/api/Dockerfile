FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
# --ignore-scripts: @app/shared has a `prepare` script that runs tsc, but its
# sources are not in the build context yet. We install deps first, then
# copy sources and explicitly build shared in the next stage.
RUN npm ci --workspaces --include-workspace-root --no-audit --no-fund --ignore-scripts

FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm --workspace @app/shared run build
RUN npm --workspace @app/api run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/scripts ./apps/api/scripts
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
USER app
EXPOSE 8080
CMD ["node", "apps/api/dist/main.js"]
