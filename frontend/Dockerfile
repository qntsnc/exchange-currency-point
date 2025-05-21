# Этап сборки приложения
FROM node:18-alpine AS build

WORKDIR /app

# 1. Копируем ТОЛЬКО package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# 2. Устанавливаем зависимости. Этот слой будет пересобираться ТОЛЬКО если package*.json изменились.
RUN npm install

# 3. Копируем остальной код приложения.
COPY . ./

# 4. Собираем приложение (production build).
RUN npm run build

# Этап для сервировки статики с помощью Nginx
FROM nginx:alpine

# Копируем собранные статические файлы из этапа 'build'
COPY --from=build /app/build /usr/share/nginx/html

# (Опционально) Копируем кастомную конфигурацию Nginx, если она нужна
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]