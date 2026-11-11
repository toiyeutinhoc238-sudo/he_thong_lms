FROM node:20-alpine
WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy source code và build frontend React
COPY . .
RUN npm run build

# Chạy server Node.js full-stack (phục vụ cả frontend dist và API backend)
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
