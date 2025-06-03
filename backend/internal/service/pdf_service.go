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
	pdf.AddUTF8Font("TDACond", "", "fonts/TDATextCondensed.ttf")

	pdf.SetFont("TDACond", "", 10)

	// Заголовок
	pdf.Cell(95, 7, "Кассовый чек")
	pdf.Ln(8)

	// Подзаголовок с номером чека
	pdf.SetFont("TDACond", "", 8)
	pdf.Cell(95, 6, fmt.Sprintf("Чек №: %s", operation.ReceiptReference))
	pdf.Ln(7)

	// Информация об операции
	pdf.SetFont("TDACond", "", 7)
	pdf.SetFillColor(240, 240, 240)
	pdf.SetDrawColor(180, 180, 180)

	// Заголовки таблицы
	pdf.CellFormat(30, 6, "Параметр", "1", 0, "L", true, 0, "")
	pdf.CellFormat(65, 6, "Значение", "1", 1, "L", true, 0, "")

	pdf.SetFillColor(255, 255, 255)

	// Дата и время операции
	pdf.CellFormat(30, 5, "Дата и время", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.OperationTimestamp.Time.Format("02.01.2006, 15:04"), "1", 1, "L", false, 0, "")

	// Тип операции
	pdf.CellFormat(30, 5, "Тип операции", "1", 0, "L", false, 0, "")
	operationType := "Покупка валюты клиентом"
	if operation.OperationType == "CLIENT_SELLS_TO_EXCHANGE" {
		operationType = "Продажа валюты клиентом"
	}
	pdf.CellFormat(65, 5, operationType, "1", 1, "L", false, 0, "")

	// Клиент
	pdf.CellFormat(30, 5, "Клиент", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.ClientName, "1", 1, "L", false, 0, "")

	// Паспорт клиента
	pdf.CellFormat(30, 5, "Паспорт", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.ClientPassportNumber, "1", 1, "L", false, 0, "")

	// Валюта
	pdf.CellFormat(30, 5, "Валюта", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.CurrencyCode, "1", 1, "L", false, 0, "")

	// Сумма в валюте
	pdf.CellFormat(30, 5, "Сумма в валюте", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, fmt.Sprintf("%s %s", operation.AmountCurrency, operation.CurrencyCode), "1", 1, "L", false, 0, "")

	// Сумма в рублях
	pdf.CellFormat(30, 5, "Сумма в рублях", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, fmt.Sprintf("%s RUB", operation.AmountRub), "1", 1, "L", false, 0, "")

	// Курс обмена
	pdf.CellFormat(30, 5, "Курс обмена", "1", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, operation.EffectiveRate, "1", 1, "L", false, 0, "")

	// Информация о компании
	pdf.Ln(5)
	pdf.SetFont("TDACond", "", 6)
	pdf.Cell(95, 4, "ООО «Обменный Пункт»")
	pdf.Ln(3)
	pdf.Cell(95, 4, "Лицензия №: 012345678")
	pdf.Ln(3)
	pdf.Cell(95, 4, "Адрес: ул. Обменная, 123, Москва")
	pdf.Ln(3)
	pdf.Cell(95, 4, "Тел.: +7 (123) 456-78-90")
	pdf.Ln(5)

	// Подписи
	pdf.SetFont("TDACond", "", 6)
	pdf.Cell(47.5, 7, "Кассир: ________________")
	pdf.Cell(47.5, 7, "Клиент: ________________")
	pdf.Ln(5)

	// Дата и время печати чека
	pdf.Cell(95, 4, fmt.Sprintf("Чек напечатан: %s", time.Now().Format("02.01.2006, 15:04")))

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
