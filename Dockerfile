# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*


# --------------------------------------------------
# Dépendances
# --------------------------------------------------

FROM base AS dependencies

COPY package*.json ./

RUN npm ci


# --------------------------------------------------
# Build commun
# --------------------------------------------------

FROM dependencies AS builder

COPY . .

RUN mkdir -p public reports runtime

# Prisma generate ne se connecte pas à PostgreSQL,
# mais prisma.config.ts peut exiger que DATABASE_URL existe.
RUN DATABASE_URL="postgresql://jobradar:jobradar@localhost:5432/jobradar" \
  npx prisma generate

# Même variable factice pendant le build.
# La vraie DATABASE_URL sera fournie au démarrage du conteneur.
RUN DATABASE_URL="postgresql://jobradar:jobradar@localhost:5432/jobradar" \
  npm run build


# --------------------------------------------------
# Image web Next.js standalone
# --------------------------------------------------

FROM base AS web

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node \
  /app/public \
  ./public

COPY --from=builder --chown=node:node \
  /app/.next/standalone \
  ./

COPY --from=builder --chown=node:node \
  /app/.next/static \
  ./.next/static

RUN mkdir -p /app/reports /app/runtime \
  && chown -R node:node /app/reports /app/runtime

USER node

EXPOSE 3000

CMD ["node", "server.js"]


# --------------------------------------------------
# Image worker / migrations / scripts
# --------------------------------------------------

FROM base AS worker

ENV NODE_ENV=production

# Le worker conserve pour l'instant :
# - les sources TypeScript ;
# - tsx ;
# - Prisma CLI ;
# - toutes les dépendances.
#
# Cette image sera plus lourde que l'image web,
# mais elle est simple, fiable et réutilisable.
COPY --from=builder --chown=node:node \
  /app \
  /app

RUN rm -rf /app/.next/cache \
  && mkdir -p /app/reports /app/runtime \
  && chown -R node:node /app/reports /app/runtime

USER node

# Comportement sûr : sans arguments ni variables,
# cette commande reste en dry-run.
CMD ["npm", "run", "workflow:daily:run"]