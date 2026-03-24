# Stage 1 (builder)
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Stage 2 (runtime)
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app .

CMD ["npm", "start"]