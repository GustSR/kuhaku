# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3333

CMD ["npm", "start"]
