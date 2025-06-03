package router

import (
	"database/sql"
	"exchange_point/backend/internal/api/handler"
	"exchange_point/backend/internal/repository/sqlcgen"
	"exchange_point/backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, dbConnection *sql.DB) {
	queries := sqlcgen.New(dbConnection)

	healthHandler := handler.NewHealthHandler()
	clientHandler := handler.NewClientHandler(queries)
	currencyHandler := handler.NewCurrencyHandler(queries)
	operationHandler := handler.NewOperationHandler(queries)
	analyticsHandler := handler.NewAnalyticsHandler(queries)
	receiptHandler := handler.NewReceiptHandler(queries, service.NewPdfService())

	api := app.Group("/api/v1")

	// Health
	api.Get("/health", healthHandler.HealthCheck)

	// Clients
	api.Get("/clients", clientHandler.GetClients)
	api.Post("/clients", clientHandler.CreateClient)
	api.Get("/clients/:id", clientHandler.GetClientByID)

	// Currencies
	api.Get("/currencies", currencyHandler.GetCurrencies)
	api.Post("/currencies", currencyHandler.CreateCurrency)
	api.Put("/currencies", currencyHandler.UpdateCurrency)

	// Operations
	api.Get("/operations", operationHandler.GetOperations)
	api.Post("/operations", operationHandler.CreateOperation)

	// Analytics
	api.Get("/analytics/operations", analyticsHandler.GetOperationsAnalytics)

	// Receipts
	api.Get("/receipts/:reference", receiptHandler.GetReceiptByReference)
}
