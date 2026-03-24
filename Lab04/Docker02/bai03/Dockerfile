FROM node:18-alpine as build

WORKDIR /app

# copy trước package.json
COPY package*.json ./
RUN npm install

# copy phần còn lại
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/build ./build

CMD ["serve", "-s", "build"]