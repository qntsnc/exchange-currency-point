package handler

import (
	"exchange_point/backend/internal/repository/sqlcgen"
	"exchange_point/backend/internal/service"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type ReceiptHandler struct {
	queries    sqlcgen.Querier
	pdfService *service.PdfService
}

func NewReceiptHandler(q sqlcgen.Querier, pdfService *service.PdfService) *ReceiptHandler {
	return &ReceiptHandler{
		queries:    q,
		pdfService: pdfService,
	}
}

// Получение PDF-чека по номеру чека (receipt_reference)
func (h *ReceiptHandler) GetReceiptByReference(c *fiber.Ctx) error {
	// Получаем номер чека из параметров запроса
	receiptReference := c.Params("reference")
	if receiptReference == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Receipt reference is required",
		})
	}

	// Ищем операцию в базе данных по номеру чека
	operations, err := h.queries.ListOperations(c.Context(), sqlcgen.ListOperationsParams{
		Limit:  100, // Задаем разумный лимит
		Offset: 0,
	})
	if err != nil {
		log.Printf("Error fetching operations: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to retrieve operations",
			"data":    err.Error(),
		})
	}

	// Ищем операцию с нужным номером чека
	var targetOperation sqlcgen.ListOperationsRow
	found := false
	for _, op := range operations {
		if op.ReceiptReference == receiptReference {
			targetOperation = op
			found = true
			break
		}
	}

	if !found {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Receipt not found",
		})
	}

	// Генерируем PDF
	pdfBytes, err := h.pdfService.GenerateReceiptFromOperation(targetOperation)
	if err != nil {
		log.Printf("Error generating PDF receipt: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to generate receipt",
			"data":    err.Error(),
		})
	}

	// Отправляем PDF пользователю
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", "inline; filename=receipt_"+receiptReference+".pdf")

	return c.Send(pdfBytes)
}
