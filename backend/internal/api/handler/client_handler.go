package handler

import (
	"database/sql"
	"exchange_point/backend/internal/repository/sqlcgen"
	"strconv"

	"github.com/gofiber/fiber/v2"
	// "log" // для отладки
)

type ClientHandler struct {
	queries sqlcgen.Querier
}

func NewClientHandler(q sqlcgen.Querier) *ClientHandler {
	return &ClientHandler{queries: q}
}

func (h *ClientHandler) GetClients(c *fiber.Ctx) error {
	clients, err := h.queries.ListClients(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Could not retrieve clients", "data": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success", "message": "Clients retrieved successfully", "data": clients})
}

func (h *ClientHandler) GetClientByID(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Invalid client ID format"})
	}

	client, err := h.queries.GetClientByID(c.Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"status": "error", "message": "Client not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Could not retrieve client", "data": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success", "message": "Client retrieved successfully", "data": client})
}

type CreateClientRequest struct {
	PassportNumber string `json:"passport_number" validate:"required"`
	FullName       string `json:"full_name" validate:"required"`
	PhoneNumber    string `json:"phone_number"` // Может быть пустым
}

func (h *ClientHandler) CreateClient(c *fiber.Ctx) error {
	req := new(CreateClientRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Cannot parse JSON", "data": err.Error()})
	}

	// TODO: Добавить валидацию полей req (например, через go-playground/validator)

	params := sqlcgen.CreateClientParams{
		PassportNumber: req.PassportNumber,
		FullName:       req.FullName,
	}
	if req.PhoneNumber != "" {
		params.PhoneNumber = sql.NullString{String: req.PhoneNumber, Valid: true}
	} else {
		params.PhoneNumber = sql.NullString{Valid: false}
	}

	client, err := h.queries.CreateClient(c.Context(), params)
	if err != nil {
		// Здесь можно добавить проверку на конкретные ошибки PostgreSQL, например, UNIQUE violation
		// pqErr, ok := err.(*pq.Error)
		// if ok && pqErr.Code == "23505" { ... }
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Could not create client", "data": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"status": "success", "message": "Client created successfully", "data": client})
}
