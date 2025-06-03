package handler

import (
	"database/sql"
	"exchange_point/backend/internal/repository/sqlcgen"
	"fmt"
	"log"
	"math/big"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type OperationHandler struct {
	queries sqlcgen.Querier
}

func NewOperationHandler(q sqlcgen.Querier) *OperationHandler {
	return &OperationHandler{queries: q}
}

type CreateOperationRequest struct {
	ClientID      int32  `json:"client_id" validate:"required"`
	OperationType string `json:"operation_type" validate:"required,oneof=CLIENT_SELLS_TO_EXCHANGE CLIENT_BUYS_FROM_EXCHANGE"`
	CurrencyID    int32  `json:"currency_id" validate:"required"`
	Amount        string `json:"amount" validate:"required,gt=0"`
	DailyLimit    string `json:"daily_currency_volume" validate:"required,gt=0"`   // Новый параметр
	SingleLimit   string `json:"single_operation_amount" validate:"required,gt=0"` // Новый параметр
}

func toBigFloat(s string) (*big.Float, error) {
	f, _, err := big.ParseFloat(s, 10, 256, big.ToNearestEven)
	if err != nil {
		return nil, fmt.Errorf("failed to parse '%s' to big.Float: %w", s, err)
	}
	return f, nil
}

func (h *OperationHandler) CreateOperation(c *fiber.Ctx) error {
	req := new(CreateOperationRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Cannot parse JSON", "data": err.Error()})
	}

	// Получить данные по валюте
	currencyDB, err := h.queries.GetCurrency(c.Context(), req.CurrencyID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"status": "error", "message": "Currency not found", "data": err.Error()})
	}

	if currencyDB.Code == "RUB" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Operations with RUB as the selected currency are not allowed"})
	}

	// Конвертировать входные данные в big.Float
	amountBig, err := toBigFloat(req.Amount)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Invalid amount format", "data": err.Error()})
	}
	buyRateBig, err := toBigFloat(currencyDB.BuyRate)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Invalid buy_rate format in DB", "data": err.Error()})
	}
	sellRateBig, err := toBigFloat(currencyDB.SellRate)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Invalid sell_rate format in DB", "data": err.Error()})
	}
	dailyLimitBig, err := toBigFloat(req.DailyLimit)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Invalid daily limit format", "data": err.Error()})
	}
	singleLimitBig, err := toBigFloat(req.SingleLimit)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Invalid single operation limit format", "data": err.Error()})
	}

	// Расчёт операции
	var amountCurrencyBig, amountRubBig, effectiveRateBig *big.Float
	if req.OperationType == "CLIENT_SELLS_TO_EXCHANGE" {
		amountCurrencyBig = amountBig
		effectiveRateBig = sellRateBig
		amountRubBig = new(big.Float).Mul(amountCurrencyBig, effectiveRateBig)
	} else if req.OperationType == "CLIENT_BUYS_FROM_EXCHANGE" {
		amountRubBig = amountBig
		effectiveRateBig = buyRateBig
		amountCurrencyBig = new(big.Float).Quo(amountRubBig, effectiveRateBig)
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Invalid operation type"})
	}

	// Проверка лимита на сумму одной операции
	if amountCurrencyBig.Cmp(singleLimitBig) > 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"status": "error",
			"message": fmt.Sprintf("Single operation amount exceeds limit. Current limit: %s, requested: %s %s",
				singleLimitBig.Text('f', 4), amountCurrencyBig.Text('f', 4), currencyDB.Code),
		})
	}

	// Проверка дневного лимита через аналитику
	today := time.Now().Truncate(24 * time.Hour)
	sqlParams := sqlcgen.GetOperationsForAnalyticsParams{
		StartDate: today,
		EndDate:   today.Add(24 * time.Hour).Add(-time.Nanosecond),
	}
	operations, err := h.queries.GetOperationsForAnalytics(c.Context(), sqlParams)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error fetching operations for analytics: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Could not fetch analytics data", "data": err.Error()})
	}

	// Вычисляем текущий дневной объём для клиента и валюты
	currentVolumeBig := big.NewFloat(0)
	for _, op := range operations {
		if op.ClientID == req.ClientID && op.CurrencyID == req.CurrencyID {
			vol, err := toBigFloat(op.AmountCurrency)
			if err != nil {
				log.Printf("Error converting operation volume: %v", err)
				continue
			}
			currentVolumeBig.Add(currentVolumeBig, vol)
		}
	}

	totalVolumeBig := new(big.Float).Add(currentVolumeBig, amountCurrencyBig)
	if totalVolumeBig.Cmp(dailyLimitBig) > 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"status": "error",
			"message": fmt.Sprintf("Daily limit of %s units for foreign currency %s exceeded. Current today: %s, this op: %s",
				dailyLimitBig.Text('f', 2), currencyDB.Code, currentVolumeBig.Text('f', 2), amountCurrencyBig.Text('f', 2)),
		})
	}

	// Подготовка параметров для sqlc
	params := sqlcgen.CreateOperationParams{
		ClientID:         req.ClientID,
		OperationType:    req.OperationType,
		CurrencyID:       req.CurrencyID,
		AmountCurrency:   amountCurrencyBig.Text('f', 4),
		AmountRub:        amountRubBig.Text('f', 4),
		EffectiveRate:    effectiveRateBig.Text('f', 8),
		ReceiptReference: fmt.Sprintf("RCPT-%d-%s", time.Now().UnixNano(), req.OperationType[:3]),
	}

	operation, err := h.queries.CreateOperation(c.Context(), params)
	if err != nil {
		log.Printf("Error creating operation in DB: %v. Params: %+v", err, params)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Could not create operation", "data": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"status": "success", "message": "Operation created successfully", "data": operation})
}

func (h *OperationHandler) GetOperations(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	} else if pageSize > 100 {
		pageSize = 100
	}
	offset := (page - 1) * pageSize

	params := sqlcgen.ListOperationsParams{
		Limit:  int32(pageSize),
		Offset: int32(offset),
	}

	operations, err := h.queries.ListOperations(c.Context(), params)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Could not retrieve operations", "data": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success", "message": "Operations retrieved successfully", "data": operations})
}
