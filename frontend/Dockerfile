FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
COPY README.md /README.md
COPY docs/images /docs/images
RUN npm run build

FROM nginx:stable-alpine

COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
