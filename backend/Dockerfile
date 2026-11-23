FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS test
COPY . .
RUN npm test

FROM node:20-alpine AS final
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js ./
COPY public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
