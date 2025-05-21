-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    passport_number VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(25) UNIQUE, -- Может быть NULL
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Таблица валют
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    buy_rate DECIMAL(19, 8) NOT NULL, -- Курс покупки валюты за рубли
    sell_rate DECIMAL(19, 8) NOT NULL, -- Курс продажи валюты за рубли
    last_rate_update_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Таблица операций обмена
CREATE TABLE IF NOT EXISTS operations (
    id BIGSERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('CLIENT_SELLS_TO_EXCHANGE', 'CLIENT_BUYS_FROM_EXCHANGE')),
    currency_id INTEGER NOT NULL REFERENCES currencies(id), -- Валюта, не рубль
    amount_currency DECIMAL(19, 4) NOT NULL, -- Сумма валюты (не рубли)
    amount_rub DECIMAL(19, 4) NOT NULL, -- Сумма в рублях
    effective_rate DECIMAL(19, 8) NOT NULL,
    operation_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    receipt_reference VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Начальные данные для валют (пример)
INSERT INTO currencies (code, name, buy_rate, sell_rate, updated_at) VALUES
('USD', 'Доллар США', 90.50000000, 89.50000000, NOW()), -- 1 USD покупается за 90.5 RUB, продаётся за 89.5 RUB
('EUR', 'Евро', 98.00000000, 97.00000000, NOW()),
('GBP', 'Британский фунт', 115.00000000, 114.00000000, NOW())
ON CONFLICT (code) DO NOTHING;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_operations_client_id ON operations(client_id);
CREATE INDEX IF NOT EXISTS idx_operations_operation_timestamp ON operations(operation_timestamp);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_clients_passport_number ON clients(passport_number);

-- Функция для обновления updated_at в таблице currencies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_currencies_updated_at ON currencies;
CREATE TRIGGER update_currencies_updated_at
	BEFORE UPDATE ON currencies
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();