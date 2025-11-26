FROM node:22-alpine

RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

RUN npm install -g tsx

COPY package*.json ./
COPY tsconfig.json ./


RUN npm ci

COPY prisma ./prisma/
COPY src/ ./src/

RUN npx prisma generate

USER nodeuser

EXPOSE 3000

CMD ["npm", "run", "start"]
