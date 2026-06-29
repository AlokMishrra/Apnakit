FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json* ./
COPY backend/prisma ./prisma/

RUN npm ci && npm install ws

RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/
COPY backend/templates ./templates/

RUN ./node_modules/.bin/tsc; exit 0

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main"]
