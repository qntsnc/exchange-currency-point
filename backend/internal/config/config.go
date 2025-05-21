package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	AppPort     string
}

func LoadConfig(path string) (*Config, error) {
	if os.Getenv("APP_ENV") != "production" {
		err := godotenv.Load(path + "/.env") // .env в корне backend
		if err != nil {
			log.Println("Warning: .env file not found or error loading:", err)
		}
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback для случаев, когда переменная не установлена (например, локальный запуск без .env)
		dbURL = "postgres://exchange_user:exchange_password@localhost:5432/exchange_db?sslmode=disable"
		log.Println("Warning: DATABASE_URL not set, using default fallback.")
	}

	appPort := os.Getenv("APP_PORT")
	if appPort == "" {
		appPort = "8080"
	}

	return &Config{
		DatabaseURL: dbURL,
		AppPort:     appPort,
	}, nil
}
