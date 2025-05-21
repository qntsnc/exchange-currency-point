-- Таблица клиентов
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    passport_number VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(25) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Таблица валют
CREATE TABLE currencies (
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
CREATE TABLE operations (
    id BIGSERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    operation_type VARCHAR(50) NOT NULL, -- CHECK constraint не нужен для sqlc моделей
    currency_id INTEGER NOT NULL REFERENCES currencies(id), -- Теперь только одна валюта (не рубль)
    amount_currency DECIMAL(19, 4) NOT NULL, -- Сумма валюты (не рубли)
    amount_rub DECIMAL(19, 4) NOT NULL, -- Сумма в рублях
    effective_rate DECIMAL(19, 8) NOT NULL,
    operation_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    receipt_reference VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);