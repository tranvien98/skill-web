FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
ARG APP_VERSION=unknown
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER root
RUN printf '%s\n' "$APP_VERSION" > /usr/share/nginx/html/version.txt
USER 101
EXPOSE 8080
