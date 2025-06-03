# Этап сборки
FROM golang:1.24-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server/main.go


# Этап выполнения
FROM alpine:latest
WORKDIR /app

COPY --from=builder /build/main .
EXPOSE 8080
CMD ["./main"]