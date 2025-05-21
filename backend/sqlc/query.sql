-- name: GetClientByPassport :one
SELECT * FROM clients
WHERE passport_number = $1 LIMIT 1;

-- name: GetClientByID :one
SELECT * FROM clients
WHERE id = $1 LIMIT 1;

-- name: ListClients :many
SELECT * FROM clients
ORDER BY full_name;

-- name: CreateClient :one
INSERT INTO clients (
  passport_number, full_name, phone_number
) VALUES (
  $1, $2, $3
)
RETURNING *;

-- name: GetCurrency :one
SELECT * FROM currencies
WHERE id = $1 LIMIT 1;

-- name: GetCurrencyByCode :one
SELECT * FROM currencies
WHERE code = $1 LIMIT 1;

-- name: ListCurrencies :many
SELECT * FROM currencies
ORDER BY code;

-- name: CreateCurrency :one
INSERT INTO currencies (
    code, name, buy_rate, sell_rate
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: UpdateCurrency :one
UPDATE currencies
SET 
    buy_rate = $2,
    sell_rate = $3,
    last_rate_update_at = NOW()
WHERE code = $1
RETURNING *;

-- name: CreateOperation :one
INSERT INTO operations (
  client_id, operation_type, currency_id, amount_currency,
  amount_rub, effective_rate, receipt_reference
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: ListOperations :many
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
    o.receipt_reference
FROM operations o
JOIN clients c ON o.client_id = c.id
JOIN currencies cur ON o.currency_id = cur.id
ORDER BY o.operation_timestamp DESC
LIMIT $1 OFFSET $2;

-- name: ListOperationsByClientAndDateRange :many
SELECT * FROM operations
WHERE client_id = $1
AND operation_timestamp >= $2 -- date_from
AND operation_timestamp <= $3 -- date_to
ORDER BY operation_timestamp DESC;

-- name: GetDailyClientForeignCurrencyVolume :one
SELECT COALESCE(SUM(CASE
                WHEN o.operation_type = 'CLIENT_SELLS_TO_EXCHANGE' THEN o.amount_currency
                WHEN o.operation_type = 'CLIENT_BUYS_FROM_EXCHANGE' THEN o.amount_currency
                ELSE 0
              END), 0.00)::DECIMAL(19,4) AS total_volume -- Приведение типа для sqlc
FROM operations o
WHERE o.client_id = sqlc.arg(client_id)
  AND DATE(o.operation_timestamp) = DATE(sqlc.arg(operation_date)::timestamptz)
  AND o.currency_id = sqlc.arg(foreign_currency_id);