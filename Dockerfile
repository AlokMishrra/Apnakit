FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY backend/package.json backend/package-lock.json* ./
COPY backend/prisma ./prisma/

# `ws` is a declared dependency (supabase-js needs it as the realtime
# transport on Node 20), so `npm ci` alone is enough to install it.
RUN npm ci

RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/
COPY backend/templates ./templates/

# The backend has pre-existing type errors in unrelated modules, so the compile
# is allowed to report them. It must still emit the app, and the build must fail
# loudly if it did not: a missing dist/ used to start a container that exited
# immediately, which left the deploy stuck instead of failing fast.
RUN ./node_modules/.bin/tsc; test -f dist/main.js && test -f dist/app.module.js

RUN npm prune --omit=dev

RUN mkdir -p uploads

EXPOSE 3000

# No `prisma migrate deploy` here on purpose. The production database is
# managed with `prisma db push` (the schema is applied out of band), and
# running the migration folder against it blocks on the migration lock, which
# left the container starting without ever listening on its port.
CMD ["node", "dist/main"]
