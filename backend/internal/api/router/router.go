package router

import (
	"database/sql"
	"exchange_point/backend/internal/api/handler"
	"exchange_point/backend/internal/repository/sqlcgen" // Путь к сгенерированному коду

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, dbConnection *sql.DB) {
	// sqlcgen.New принимает *sql.DB (или *sql.Tx),
	// так как *sql.DB реализует интерфейс DBTX, который ожидает sqlc.
	queries := sqlcgen.New(dbConnection)

	healthHandler := handler.NewHealthHandler()
	clientHandler := handler.NewClientHandler(queries)
	currencyHandler := handler.NewCurrencyHandler(queries)
	operationHandler := handler.NewOperationHandler(queries)

	api := app.Group("/api/v1")

	// Health
	api.Get("/health", healthHandler.HealthCheck)

	// Clients
	api.Get("/clients", clientHandler.GetClients)
	api.Post("/clients", clientHandler.CreateClient)
	api.Get("/clients/:id", clientHandler.GetClientByID)
	app.Post("/api/v1/currencies", currencyHandler.CreateCurrency)
	app.Put("/api/v1/currencies", currencyHandler.UpdateCurrency)
	// Currencies
	api.Get("/currencies", currencyHandler.GetCurrencies)
	// api.Post("/currencies/rate", currencyHandler.UpdateRate) // Пример для обновления курса

	// Operations
	api.Get("/operations", operationHandler.GetOperations)
	api.Post("/operations", operationHandler.CreateOperation)
}
