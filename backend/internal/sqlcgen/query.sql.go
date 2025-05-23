// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.29.0
// source: query.sql

package sqlcgen

import (
	"context"
	"database/sql"
	"time"
)

const createClient = `-- name: CreateClient :one
INSERT INTO clients (
    passport_number, full_name, phone_number, created_at
) VALUES (
    $1, $2, $3,
    jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    )
)
RETURNING id, passport_number, full_name, phone_number, created_at
`

type CreateClientParams struct {
	PassportNumber string         `json:"passport_number"`
	FullName       string         `json:"full_name"`
	PhoneNumber    sql.NullString `json:"phone_number"`
}

func (q *Queries) CreateClient(ctx context.Context, arg CreateClientParams) (Client, error) {
	row := q.queryRow(ctx, q.createClientStmt, createClient, arg.PassportNumber, arg.FullName, arg.PhoneNumber)
	var i Client
	err := row.Scan(
		&i.ID,
		&i.PassportNumber,
		&i.FullName,
		&i.PhoneNumber,
		&i.CreatedAt,
	)
	return i, err
}

const createCurrency = `-- name: CreateCurrency :one
INSERT INTO currencies (
    code, name, buy_rate, sell_rate, last_rate_update_at, created_at, updated_at
) VALUES (
    $1, $2, $3, $4,
    jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    ),
    jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    ),
    jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    )
)
RETURNING id, code, name, buy_rate, sell_rate, last_rate_update_at, created_at, updated_at
`

type CreateCurrencyParams struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	BuyRate  string `json:"buy_rate"`
	SellRate string `json:"sell_rate"`
}

func (q *Queries) CreateCurrency(ctx context.Context, arg CreateCurrencyParams) (Currency, error) {
	row := q.queryRow(ctx, q.createCurrencyStmt, createCurrency,
		arg.Code,
		arg.Name,
		arg.BuyRate,
		arg.SellRate,
	)
	var i Currency
	err := row.Scan(
		&i.ID,
		&i.Code,
		&i.Name,
		&i.BuyRate,
		&i.SellRate,
		&i.LastRateUpdateAt,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const createOperation = `-- name: CreateOperation :one
INSERT INTO operations (
    client_id, operation_type, currency_id, amount_currency,
    amount_rub, effective_rate, receipt_reference, operation_timestamp, created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    ),
    jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    )
)
RETURNING id, client_id, operation_type, currency_id, amount_currency,
          amount_rub, effective_rate, operation_timestamp, receipt_reference, created_at
`

type CreateOperationParams struct {
	ClientID         int32  `json:"client_id"`
	OperationType    string `json:"operation_type"`
	CurrencyID       int32  `json:"currency_id"`
	AmountCurrency   string `json:"amount_currency"`
	AmountRub        string `json:"amount_rub"`
	EffectiveRate    string `json:"effective_rate"`
	ReceiptReference string `json:"receipt_reference"`
}

func (q *Queries) CreateOperation(ctx context.Context, arg CreateOperationParams) (Operation, error) {
	row := q.queryRow(ctx, q.createOperationStmt, createOperation,
		arg.ClientID,
		arg.OperationType,
		arg.CurrencyID,
		arg.AmountCurrency,
		arg.AmountRub,
		arg.EffectiveRate,
		arg.ReceiptReference,
	)
	var i Operation
	err := row.Scan(
		&i.ID,
		&i.ClientID,
		&i.OperationType,
		&i.CurrencyID,
		&i.AmountCurrency,
		&i.AmountRub,
		&i.EffectiveRate,
		&i.OperationTimestamp,
		&i.ReceiptReference,
		&i.CreatedAt,
	)
	return i, err
}

const getClientByID = `-- name: GetClientByID :one
SELECT id, passport_number, full_name, phone_number, created_at FROM clients
WHERE id = $1 LIMIT 1
`

func (q *Queries) GetClientByID(ctx context.Context, id int32) (Client, error) {
	row := q.queryRow(ctx, q.getClientByIDStmt, getClientByID, id)
	var i Client
	err := row.Scan(
		&i.ID,
		&i.PassportNumber,
		&i.FullName,
		&i.PhoneNumber,
		&i.CreatedAt,
	)
	return i, err
}

const getClientByPassport = `-- name: GetClientByPassport :one
SELECT id, passport_number, full_name, phone_number, created_at FROM clients
WHERE passport_number = $1 LIMIT 1
`

func (q *Queries) GetClientByPassport(ctx context.Context, passportNumber string) (Client, error) {
	row := q.queryRow(ctx, q.getClientByPassportStmt, getClientByPassport, passportNumber)
	var i Client
	err := row.Scan(
		&i.ID,
		&i.PassportNumber,
		&i.FullName,
		&i.PhoneNumber,
		&i.CreatedAt,
	)
	return i, err
}

const getCurrency = `-- name: GetCurrency :one
SELECT id, code, name, buy_rate, sell_rate, last_rate_update_at, created_at, updated_at FROM currencies
WHERE id = $1 LIMIT 1
`

func (q *Queries) GetCurrency(ctx context.Context, id int32) (Currency, error) {
	row := q.queryRow(ctx, q.getCurrencyStmt, getCurrency, id)
	var i Currency
	err := row.Scan(
		&i.ID,
		&i.Code,
		&i.Name,
		&i.BuyRate,
		&i.SellRate,
		&i.LastRateUpdateAt,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getCurrencyByCode = `-- name: GetCurrencyByCode :one
SELECT id, code, name, buy_rate, sell_rate, last_rate_update_at, created_at, updated_at FROM currencies
WHERE code = $1 LIMIT 1
`

func (q *Queries) GetCurrencyByCode(ctx context.Context, code string) (Currency, error) {
	row := q.queryRow(ctx, q.getCurrencyByCodeStmt, getCurrencyByCode, code)
	var i Currency
	err := row.Scan(
		&i.ID,
		&i.Code,
		&i.Name,
		&i.BuyRate,
		&i.SellRate,
		&i.LastRateUpdateAt,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getDailyClientForeignCurrencyVolume = `-- name: GetDailyClientForeignCurrencyVolume :one
SELECT COALESCE(SUM(CASE
                WHEN o.operation_type = 'CLIENT_SELLS_TO_EXCHANGE' THEN o.amount_currency
                WHEN o.operation_type = 'CLIENT_BUYS_FROM_EXCHANGE' THEN o.amount_currency
                ELSE 0
              END), 0.00)::DECIMAL(19,4) AS total_volume
FROM operations o
WHERE o.client_id = $1
  AND o.operation_timestamp->>'year'::int = EXTRACT(YEAR FROM $2::timestamptz)
  AND o.operation_timestamp->>'month'::int = EXTRACT(MONTH FROM $2::timestamptz)
  AND o.operation_timestamp->>'day'::int = EXTRACT(DAY FROM $2::timestamptz)
  AND o.currency_id = $3
`

type GetDailyClientForeignCurrencyVolumeParams struct {
	ClientID          int32     `json:"client_id"`
	OperationDate     time.Time `json:"operation_date"`
	ForeignCurrencyID int32     `json:"foreign_currency_id"`
}

func (q *Queries) GetDailyClientForeignCurrencyVolume(ctx context.Context, arg GetDailyClientForeignCurrencyVolumeParams) (string, error) {
	row := q.queryRow(ctx, q.getDailyClientForeignCurrencyVolumeStmt, getDailyClientForeignCurrencyVolume, arg.ClientID, arg.OperationDate, arg.ForeignCurrencyID)
	var total_volume string
	err := row.Scan(&total_volume)
	return total_volume, err
}

const listClients = `-- name: ListClients :many
SELECT id, passport_number, full_name, phone_number, created_at FROM clients
ORDER BY full_name
`

func (q *Queries) ListClients(ctx context.Context) ([]Client, error) {
	rows, err := q.query(ctx, q.listClientsStmt, listClients)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Client
	for rows.Next() {
		var i Client
		if err := rows.Scan(
			&i.ID,
			&i.PassportNumber,
			&i.FullName,
			&i.PhoneNumber,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listCurrencies = `-- name: ListCurrencies :many
SELECT id, code, name, buy_rate, sell_rate, last_rate_update_at, created_at, updated_at FROM currencies
ORDER BY code
`

func (q *Queries) ListCurrencies(ctx context.Context) ([]Currency, error) {
	rows, err := q.query(ctx, q.listCurrenciesStmt, listCurrencies)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Currency
	for rows.Next() {
		var i Currency
		if err := rows.Scan(
			&i.ID,
			&i.Code,
			&i.Name,
			&i.BuyRate,
			&i.SellRate,
			&i.LastRateUpdateAt,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listOperations = `-- name: ListOperations :many
SELECT
    o.id,
    o.client_id,
    c.full_name AS client_name,
    c.passport_number AS client_passport_number,
    o.operation_type,
    cur.code AS currency_code,
    o.amount_currency,
    o.amount_rub,
    o.effective_rate,
    o.operation_timestamp,
    o.receipt_reference,
    o.created_at
FROM operations o
JOIN clients c ON o.client_id = c.id
JOIN currencies cur ON o.currency_id = cur.id
ORDER BY o.operation_timestamp->>'year'::int DESC,
         o.operation_timestamp->>'month'::int DESC,
         o.operation_timestamp->>'day'::int DESC,
         o.operation_timestamp->>'hour'::int DESC,
         o.operation_timestamp->>'minute'::int DESC,
         o.operation_timestamp->>'second'::int DESC
LIMIT $1 OFFSET $2
`

type ListOperationsParams struct {
	Limit  int32 `json:"limit"`
	Offset int32 `json:"offset"`
}

type ListOperationsRow struct {
	ID                   int64     `json:"id"`
	ClientID             int32     `json:"client_id"`
	ClientName           string    `json:"client_name"`
	ClientPassportNumber string    `json:"client_passport_number"`
	OperationType        string    `json:"operation_type"`
	CurrencyCode         string    `json:"currency_code"`
	AmountCurrency       string    `json:"amount_currency"`
	AmountRub            string    `json:"amount_rub"`
	EffectiveRate        string    `json:"effective_rate"`
	OperationTimestamp   time.Time `json:"operation_timestamp"`
	ReceiptReference     string    `json:"receipt_reference"`
	CreatedAt            time.Time `json:"created_at"`
}

func (q *Queries) ListOperations(ctx context.Context, arg ListOperationsParams) ([]ListOperationsRow, error) {
	rows, err := q.query(ctx, q.listOperationsStmt, listOperations, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListOperationsRow
	for rows.Next() {
		var i ListOperationsRow
		if err := rows.Scan(
			&i.ID,
			&i.ClientID,
			&i.ClientName,
			&i.ClientPassportNumber,
			&i.OperationType,
			&i.CurrencyCode,
			&i.AmountCurrency,
			&i.AmountRub,
			&i.EffectiveRate,
			&i.OperationTimestamp,
			&i.ReceiptReference,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listOperationsByClientAndDateRange = `-- name: ListOperationsByClientAndDateRange :many
SELECT id, client_id, operation_type, currency_id, amount_currency, amount_rub, effective_rate, operation_timestamp, receipt_reference, created_at FROM operations
WHERE client_id = $1
AND operation_timestamp->>'year'::int >= EXTRACT(YEAR FROM $2::timestamptz)
AND operation_timestamp->>'month'::int >= EXTRACT(MONTH FROM $2::timestamptz)
AND operation_timestamp->>'day'::int >= EXTRACT(DAY FROM $2::timestamptz)
AND operation_timestamp->>'year'::int <= EXTRACT(YEAR FROM $3::timestamptz)
AND operation_timestamp->>'month'::int <= EXTRACT(MONTH FROM $3::timestamptz)
AND operation_timestamp->>'day'::int <= EXTRACT(DAY FROM $3::timestamptz)
ORDER BY operation_timestamp->>'year'::int DESC,
         operation_timestamp->>'month'::int DESC,
         operation_timestamp->>'day'::int DESC,
         operation_timestamp->>'hour'::int DESC,
         operation_timestamp->>'minute'::int DESC,
         operation_timestamp->>'second'::int DESC
`

type ListOperationsByClientAndDateRangeParams struct {
	ClientID int32     `json:"client_id"`
	Column2  time.Time `json:"column_2"`
	Column3  time.Time `json:"column_3"`
}

func (q *Queries) ListOperationsByClientAndDateRange(ctx context.Context, arg ListOperationsByClientAndDateRangeParams) ([]Operation, error) {
	rows, err := q.query(ctx, q.listOperationsByClientAndDateRangeStmt, listOperationsByClientAndDateRange, arg.ClientID, arg.Column2, arg.Column3)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Operation
	for rows.Next() {
		var i Operation
		if err := rows.Scan(
			&i.ID,
			&i.ClientID,
			&i.OperationType,
			&i.CurrencyID,
			&i.AmountCurrency,
			&i.AmountRub,
			&i.EffectiveRate,
			&i.OperationTimestamp,
			&i.ReceiptReference,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateCurrency = `-- name: UpdateCurrency :one
UPDATE currencies
SET 
    buy_rate = $2,
    sell_rate = $3,
    last_rate_update_at = jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    ),
    updated_at = jsonb_build_object(
        'year', EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
        'month', EXTRACT(MONTH FROM CURRENT_TIMESTAMP),
        'day', EXTRACT(DAY FROM CURRENT_TIMESTAMP),
        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
        'minute', EXTRACT(MINUTE FROM CURRENT_TIMESTAMP),
        'second', EXTRACT(SECOND FROM CURRENT_TIMESTAMP)
    )
WHERE code = $1
RETURNING id, code, name, buy_rate, sell_rate, last_rate_update_at, created_at, updated_at
`

type UpdateCurrencyParams struct {
	Code     string `json:"code"`
	BuyRate  string `json:"buy_rate"`
	SellRate string `json:"sell_rate"`
}

func (q *Queries) UpdateCurrency(ctx context.Context, arg UpdateCurrencyParams) (Currency, error) {
	row := q.queryRow(ctx, q.updateCurrencyStmt, updateCurrency, arg.Code, arg.BuyRate, arg.SellRate)
	var i Currency
	err := row.Scan(
		&i.ID,
		&i.Code,
		&i.Name,
		&i.BuyRate,
		&i.SellRate,
		&i.LastRateUpdateAt,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
