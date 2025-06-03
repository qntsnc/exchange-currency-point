package handler

import (
	"exchange_point/backend/internal/repository/sqlcgen"
	"log"
	"math/big"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
)

type AnalyticsHandler struct {
	queries sqlcgen.Querier
}

func NewAnalyticsHandler(q sqlcgen.Querier) *AnalyticsHandler {
	return &AnalyticsHandler{queries: q}
}

// Структуры для данных аналитики
type OperationsByDateItem struct {
	Date              string  `json:"date"`
	Count             int     `json:"count"`
	AmountRub         float64 `json:"amount_rub"`
	ClientSellsCount  int     `json:"client_sells_count"`
	ClientBuysCount   int     `json:"client_buys_count"`
	ClientSellsVolume float64 `json:"client_sells_volume"`
	ClientBuysVolume  float64 `json:"client_buys_volume"`
}

type CurrencyVolumeItem struct {
	CurrencyCode string  `json:"currency_code"`
	CurrencyName string  `json:"currency_name"`
	Volume       float64 `json:"volume"`
	RubVolume    float64 `json:"rub_volume"`
}

type OperationSummary struct {
	TotalOperations     int                    `json:"total_operations"`
	TotalAmountRub      float64                `json:"total_amount_rub"`
	CurrencyVolumes     []CurrencyVolumeItem   `json:"currency_volumes"`
	AverageRates        map[string]float64     `json:"average_rates"`
	ClientSellsCount    int                    `json:"client_sells_count"`
	ClientBuysCount     int                    `json:"client_buys_count"`
	DailyOperations     []OperationsByDateItem `json:"daily_operations"`
	ClientSellsRubTotal float64                `json:"client_sells_rub_total"`
	ClientBuysRubTotal  float64                `json:"client_buys_rub_total"`
}

// Параметры запроса аналитики
type GetAnalyticsParams struct {
	StartDate     time.Time `query:"start_date"`
	EndDate       time.Time `query:"end_date"`
	CurrencyCode  string    `query:"currency_code"`
	OperationType string    `query:"operation_type"`
}

// Получение аналитики операций
func (h *AnalyticsHandler) GetOperationsAnalytics(c *fiber.Ctx) error {
	// Парсинг параметров запроса
	// Установка значений по умолчанию для дат
	now := time.Now()
	defaultStartDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	defaultEndDate := now

	startDateStr := c.Query("start_date", defaultStartDate.Format("2006-01-02"))
	endDateStr := c.Query("end_date", defaultEndDate.Format("2006-01-02"))

	var err error
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		startDate = defaultStartDate
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		endDate = defaultEndDate
	}
	// Устанавливаем конец дня для EndDate
	endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())

	currencyCode := c.Query("currency_code", "")
	operationType := c.Query("operation_type", "")

	// Получение данных из базы
	// Создаем параметры для SQL запроса
	sqlParams := sqlcgen.GetOperationsForAnalyticsParams{
		StartDate: startDate,
		EndDate:   endDate,
	}

	operations, err := h.queries.GetOperationsForAnalytics(c.Context(), sqlParams)
	if err != nil {
		log.Printf("Error fetching operations for analytics: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Error fetching analytics data",
			"data":    err.Error(),
		})
	}

	// Фильтрация по дополнительным параметрам на серверной стороне (если указаны)
	var filteredOperations []sqlcgen.GetOperationsForAnalyticsRow
	for _, op := range operations {
		if currencyCode != "" && op.CurrencyCode != currencyCode {
			continue
		}
		if operationType != "" && op.OperationType != operationType {
			continue
		}
		filteredOperations = append(filteredOperations, op)
	}

	// Обработка данных для аналитики
	analyticsData := processAnalyticsData(filteredOperations, startDate, endDate)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Analytics data retrieved successfully",
		"data":    analyticsData,
	})
}

// Обработка данных для аналитики
func processAnalyticsData(operations []sqlcgen.GetOperationsForAnalyticsRow, startDate, endDate time.Time) OperationSummary {
	summary := OperationSummary{
		TotalOperations:     len(operations),
		TotalAmountRub:      0,
		CurrencyVolumes:     []CurrencyVolumeItem{},
		AverageRates:        make(map[string]float64),
		ClientSellsCount:    0,
		ClientBuysCount:     0,
		DailyOperations:     []OperationsByDateItem{},
		ClientSellsRubTotal: 0,
		ClientBuysRubTotal:  0,
	}

	// Подготовка вспомогательных структур для расчетов
	currencyVolumes := make(map[string]*CurrencyVolumeItem)
	ratesSum := make(map[string]*big.Float)
	ratesCount := make(map[string]int)

	operationsByDate := make(map[string]*OperationsByDateItem)

	// Заполняем все даты в диапазоне, даже если нет операций
	current := startDate
	for !current.After(endDate) {
		dateStr := current.Format("2006-01-02")
		operationsByDate[dateStr] = &OperationsByDateItem{
			Date:              dateStr,
			Count:             0,
			AmountRub:         0,
			ClientSellsCount:  0,
			ClientBuysCount:   0,
			ClientSellsVolume: 0,
			ClientBuysVolume:  0,
		}
		current = current.AddDate(0, 0, 1)
	}

	// Обработка каждой операции
	for _, op := range operations {
		// Преобразуем строковые значения в числа
		amountRub, _ := new(big.Float).SetString(op.AmountRub)
		amountCurrency, _ := new(big.Float).SetString(op.AmountCurrency)
		effectiveRate, _ := new(big.Float).SetString(op.EffectiveRate)

		// Преобразуем big.Float в float64 для удобства в JSON
		amountRubF64, _ := amountRub.Float64()
		amountCurrencyF64, _ := amountCurrency.Float64()

		// Общая сумма в рублях
		summary.TotalAmountRub += amountRubF64

		// Расчет по валютам
		if _, exists := currencyVolumes[op.CurrencyCode]; !exists {
			currencyVolumes[op.CurrencyCode] = &CurrencyVolumeItem{
				CurrencyCode: op.CurrencyCode,
				CurrencyName: op.CurrencyName,
				Volume:       0,
				RubVolume:    0,
			}
		}
		currencyVolumes[op.CurrencyCode].Volume += amountCurrencyF64
		currencyVolumes[op.CurrencyCode].RubVolume += amountRubF64

		// Накопление данных для средних курсов
		if _, exists := ratesSum[op.CurrencyCode]; !exists {
			ratesSum[op.CurrencyCode] = new(big.Float)
			ratesCount[op.CurrencyCode] = 0
		}
		ratesSum[op.CurrencyCode] = new(big.Float).Add(ratesSum[op.CurrencyCode], effectiveRate)
		ratesCount[op.CurrencyCode]++

		// Учет типа операции
		if op.OperationType == "CLIENT_SELLS_TO_EXCHANGE" {
			summary.ClientSellsCount++
			summary.ClientSellsRubTotal += amountRubF64
		} else if op.OperationType == "CLIENT_BUYS_FROM_EXCHANGE" {
			summary.ClientBuysCount++
			summary.ClientBuysRubTotal += amountRubF64
		}

		// Группировка по дням
		opDate := op.OperationTimestamp.Time.Format("2006-01-02")
		if _, exists := operationsByDate[opDate]; exists {
			operationsByDate[opDate].Count++
			operationsByDate[opDate].AmountRub += amountRubF64

			if op.OperationType == "CLIENT_SELLS_TO_EXCHANGE" {
				operationsByDate[opDate].ClientSellsCount++
				operationsByDate[opDate].ClientSellsVolume += amountCurrencyF64
			} else if op.OperationType == "CLIENT_BUYS_FROM_EXCHANGE" {
				operationsByDate[opDate].ClientBuysCount++
				operationsByDate[opDate].ClientBuysVolume += amountCurrencyF64
			}
		}
	}

	// Формирование итоговых данных
	// Добавляем объемы валют
	for _, v := range currencyVolumes {
		summary.CurrencyVolumes = append(summary.CurrencyVolumes, *v)
	}

	// Рассчитываем средние курсы
	for currency, sum := range ratesSum {
		count := ratesCount[currency]
		if count > 0 {
			avg := new(big.Float).Quo(sum, new(big.Float).SetInt64(int64(count)))
			avgF64, _ := avg.Float64()
			summary.AverageRates[currency] = avgF64
		}
	}

	// Добавляем данные по дням в хронологическом порядке
	current = startDate
	for !current.After(endDate) {
		dateStr := current.Format("2006-01-02")
		if daily, exists := operationsByDate[dateStr]; exists {
			summary.DailyOperations = append(summary.DailyOperations, *daily)
		}
		current = current.AddDate(0, 0, 1)
	}

	return summary
}
