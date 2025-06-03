# Этап сборки приложения
FROM node:18-alpine AS build

WORKDIR /app

# 1. Копируем ТОЛЬКО package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# 2. Устанавливаем зависимости. Этот слой будет пересобираться ТОЛЬКО если package*.json изменились.
RUN npm install

# 3. Копируем остальной код приложения.
COPY . ./

# Устанавливаем переменную окружения для API URL
ENV REACT_APP_API_URL=http://backend:8080/api/v1

# 4. Собираем приложение (production build).
RUN npm run build

# Этап для сервировки статики с помощью serve
FROM node:18-alpine

WORKDIR /app

# Устанавливаем serve глобально
RUN npm install -g serve

# Копируем собранные файлы из этапа сборки
COPY --from=build /app/build /app

EXPOSE 3000

# Запускаем serve
CMD ["serve", "-s", "/app", "-l", "3000"]