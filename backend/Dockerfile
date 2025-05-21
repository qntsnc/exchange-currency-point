# Этап сборки
FROM golang:1.24-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api/main.go
RUN ls -l /build # <--- ДОБАВЬТЕ ЭТУ СТРОКУ (покажет содержимое /build после компиляции)

# Этап выполнения
FROM alpine:latest
WORKDIR /app
COPY --from=builder /build/main .
RUN ls -l /app 
EXPOSE 8080
CMD ["./main"]