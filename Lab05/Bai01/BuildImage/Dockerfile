# Stage 1: deps (heavy image)
FROM golang:1.24-bookworm AS deps
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

# Stage 2: test
FROM deps AS test
COPY . .
RUN go test ./...

# Stage 3: build
FROM deps AS build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /out/app ./main.go

# Stage 4: runtime (very small)
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=build /out/app /app/app
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/app"]
