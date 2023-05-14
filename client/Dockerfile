FROM node:lts-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run prod

FROM nginx:alpine
COPY --from=builder /app/dist/client /usr/share/nginx/html
