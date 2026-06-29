FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
COPY backend/prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/
COPY backend/templates ./templates/

RUN ./node_modules/.bin/tsc; exit 0

RUN npm prune --omit=dev

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
