FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY frontend/package.json frontend/package-lock.json* frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts ./
COPY frontend/index.html ./
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:stable-alpine
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
