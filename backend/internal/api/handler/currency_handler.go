package handler

import (
	"exchange_point/backend/internal/repository/sqlcgen"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

type CurrencyHandler struct {
	queries sqlcgen.Querier
}

func NewCurrencyHandler(q sqlcgen.Querier) *CurrencyHandler {
	return &CurrencyHandler{queries: q}
}

// GetCurrencies получает список всех валют
func (h *CurrencyHandler) GetCurrencies(c *fiber.Ctx) error {
	currencies, err := h.queries.ListCurrencies(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not retrieve currencies",
			"data":    err.Error(),
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": "Currencies retrieved successfully",
		"data":    currencies,
	})
}

// CreateCurrency создаёт новую валюту
func (h *CurrencyHandler) CreateCurrency(c *fiber.Ctx) error {
	var req struct {
		Code     string  `json:"code"`
		Name     string  `json:"name"`
		BuyRate  float64 `json:"buy_rate"`
		SellRate float64 `json:"sell_rate"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body: " + err.Error(),
		})
	}

	currency, err := h.queries.CreateCurrency(c.Context(), sqlcgen.CreateCurrencyParams{
		Code:     req.Code,
		Name:     req.Name,
		BuyRate:  fmt.Sprintf("%.8f", req.BuyRate),
		SellRate: fmt.Sprintf("%.8f", req.SellRate),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not create currency",
			"data":    err.Error(),
		})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status":  "success",
		"message": "Currency created successfully",
		"data":    currency,
	})
}

// UpdateCurrency обновляет курс валюты
func (h *CurrencyHandler) UpdateCurrency(c *fiber.Ctx) error {
	var req struct {
		Code     string  `json:"code"`
		BuyRate  float64 `json:"buy_rate"`
		SellRate float64 `json:"sell_rate"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body: " + err.Error(),
		})
	}

	currency, err := h.queries.UpdateCurrency(c.Context(), sqlcgen.UpdateCurrencyParams{
		Code:     req.Code,
		BuyRate:  fmt.Sprintf("%.8f", req.BuyRate),
		SellRate: fmt.Sprintf("%.8f", req.SellRate),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not update currency",
			"data":    err.Error(),
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": "Currency updated successfully",
		"data":    currency,
	})
}
