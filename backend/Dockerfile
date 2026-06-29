FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
COPY templates ./templates/

RUN npx tsc

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
