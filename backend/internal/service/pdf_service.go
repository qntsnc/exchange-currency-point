package service

import (
	"bytes"
	"exchange_point/backend/internal/repository/sqlcgen"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"
)

type PdfService struct{}

func NewPdfService() *PdfService {
	return &PdfService{}
}

func (s *PdfService) GenerateReceiptFromOperation(operation sqlcgen.ListOperationsRow) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A6", "")
	// Регистрируем пользовательский шрифт, расположенный в папке fonts
	// pdf.AddUTF8Font("TDACond", "", "backend/fonts/TDATextCondensed.ttf")

	pdf.SetFont("Arial", "", 10)

	// Title
	pdf.Cell(95, 7, "Receipt")
	pdf.Ln(8)

	// Subtitle with receipt number
	pdf.SetFont("Arial", "", 8)
	pdf.Cell(95, 6, fmt.Sprintf("Receipt No: %s", operation.ReceiptReference))
	pdf.Ln(7)

	// Operation info
	pdf.SetFont("Arial", "", 7)
	pdf.SetFillColor(240, 240, 240)
	pdf.SetDrawColor(180, 180, 180)

	// Table headers
	pdf.CellFormat(30, 6, "Parameter", "1", 0, "L", true, 0, "")
	pdf.CellFormat(65, 6, "Value", "1", 1, "L", true, 0, "")

	pdf.SetFillColor(255, 255, 255)

	// Date and time
	pdf.CellFormat(30, 5, "Date & Time", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.OperationTimestamp.Time.Format("02.01.2006, 15:04"), "1", 1, "L", false, 0, "")

	// Operation type
	pdf.CellFormat(30, 5, "Operation Type", "1", 0, "L", false, 0, "")
	operationType := "Client buys currency"
	if operation.OperationType == "CLIENT_SELLS_TO_EXCHANGE" {
		operationType = "Client sells currency"
	}
	pdf.CellFormat(65, 5, operationType, "1", 1, "L", false, 0, "")

	// Client
	pdf.CellFormat(30, 5, "Client", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.ClientName, "1", 1, "L", false, 0, "")

	// Passport
	pdf.CellFormat(30, 5, "Passport", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.ClientPassportNumber, "1", 1, "L", false, 0, "")

	// Currency
	pdf.CellFormat(30, 5, "Currency", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.CurrencyCode, "1", 1, "L", false, 0, "")

	// Amount in currency
	pdf.CellFormat(30, 5, "Amount (currency)", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, fmt.Sprintf("%s %s", operation.AmountCurrency, operation.CurrencyCode), "1", 1, "L", false, 0, "")

	// Amount in RUB
	pdf.CellFormat(30, 5, "Amount (RUB)", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, fmt.Sprintf("%s RUB", operation.AmountRub), "1", 1, "L", false, 0, "")

	// Exchange rate
	pdf.CellFormat(30, 5, "Exchange Rate", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.EffectiveRate, "1", 1, "L", false, 0, "")

	// Company info
	pdf.Ln(5)
	pdf.SetFont("Arial", "", 6)
	pdf.Cell(95, 4, "Exchange Point LLC")
	pdf.Ln(3)
	pdf.Cell(95, 4, "License No: 012345678")
	pdf.Ln(3)
	pdf.Cell(95, 4, "Address: 123 Exchange St, Moscow")
	pdf.Ln(3)
	pdf.Cell(95, 4, "Phone: +7 (123) 456-78-90")
	pdf.Ln(5)

	// Signatures
	pdf.SetFont("Arial", "", 6)
	pdf.Cell(47.5, 7, "Cashier: ________________")
	pdf.Cell(47.5, 7, "Client: ________________")
	pdf.Ln(5)

	// Print date and time
	pdf.Cell(95, 4, fmt.Sprintf("Printed: %s", time.Now().Format("02.01.2006, 15:04")))

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
