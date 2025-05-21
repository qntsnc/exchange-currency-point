package main

import (
	"context"
	"log"

	"exchange_point/backend/internal/api/router"
	"exchange_point/backend/internal/config"
	"exchange_point/backend/internal/repository/postgresql"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	// _ "github.com/lib/pq" // Драйвер регистрируется в db.go
)

func main() {
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Could not load config: %v", err)
	}

	dbConn, err := postgresql.NewDBConnection(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer dbConn.Close()

	log.Println("Successfully connected to the database!")

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Для разработки, в production лучше указать конкретные домены
		AllowHeaders: "Origin, Content-Type, Accept",
	}))
	app.Use(logger.New())

	router.SetupRoutes(app, dbConn)

	log.Printf("Starting server on port %s", cfg.AppPort)
	err = app.Listen(":" + cfg.AppPort)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
