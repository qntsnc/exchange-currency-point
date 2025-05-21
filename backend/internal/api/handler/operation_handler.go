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
	Amount        string `json:"amount" validate:"required,gt=0"` // Сумма валюты (для продажи) или рублей (для покупки)
}

// Helper to convert string decimal to *big.Float for precise calculations
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

	// Проверяем, что валюта не рубль (рубль не должен быть в таблице currencies)
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

	// Расчёт операции
	var amountCurrencyBig, amountRubBig, effectiveRateBig *big.Float

	if req.OperationType == "CLIENT_SELLS_TO_EXCHANGE" {
		// Клиент продаёт валюту, получает рубли
		amountCurrencyBig = amountBig                                          // Сумма валюты
		effectiveRateBig = sellRateBig                                         // Используем курс продажи
		amountRubBig = new(big.Float).Mul(amountCurrencyBig, effectiveRateBig) // Рубли = валюта * курс продажи
	} else if req.OperationType == "CLIENT_BUYS_FROM_EXCHANGE" {
		// Клиент покупает валюту за рубли
		amountRubBig = amountBig                                               // Сумма рублей
		effectiveRateBig = buyRateBig                                          // Используем курс покупки
		amountCurrencyBig = new(big.Float).Quo(amountRubBig, effectiveRateBig) // Валюта = рубли / курс покупки
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Invalid operation type"})
	}

	// Проверка дневного лимита (1000 единиц иностранной валюты)
	dailyVolumeParams := sqlcgen.GetDailyClientForeignCurrencyVolumeParams{
		ClientID:          req.ClientID,
		ForeignCurrencyID: req.CurrencyID,
		OperationDate:     time.Now(),
	}
	currentVolumeStr, err := h.queries.GetDailyClientForeignCurrencyVolume(c.Context(), dailyVolumeParams)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error getting daily volume: %v", err)
	} else if err == nil {
		currentVolumeBig, convErr := toBigFloat(currentVolumeStr)
		if convErr != nil {
			log.Printf("Error converting current volume string to big.Float: %v", convErr)
		} else {
			totalVolumeBig := new(big.Float).Add(currentVolumeBig, amountCurrencyBig)
			limitBig := big.NewFloat(1000.00)
			if totalVolumeBig.Cmp(limitBig) > 0 {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"status":  "error",
					"message": fmt.Sprintf("Daily limit of 1000 units for foreign currency %s exceeded. Current today: %s, this op: %s", currencyDB.Code, currentVolumeBig.Text('f', 2), amountCurrencyBig.Text('f', 2)),
				})
			}
		}
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

	operations, err := h.queries.ListOperations(c.Context(), params) // Исправлено: queries вместо quires
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Could not retrieve operations", "data": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success", "message": "Operations retrieved successfully", "data": operations})
}
