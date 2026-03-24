FROM golang:1.26

WORKDIR /app

COPY go.mod ./
RUN go mod tidy

COPY . .

RUN go build -o app

CMD ["./app"]