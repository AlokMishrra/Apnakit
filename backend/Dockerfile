FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
COPY templates ./templates/

RUN npx tsc; exit 0

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy 2>&1; node dist/main"]
