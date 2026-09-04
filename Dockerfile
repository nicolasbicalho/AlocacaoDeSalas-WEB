# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Development: Vite dev server com HMR ----
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3100
CMD ["npm", "run", "dev"]

# ---- Build: gera o bundle de produção ----
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---- Production: serve o bundle estático com nginx (para demo/banca) ----
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
