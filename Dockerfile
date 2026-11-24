FROM node:20-alpine
WORKDIR /app

# Cài đặt dependencies ổn định, nhanh và không treo trên Render Free Tier
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy mã nguồn (đã lọc qua .dockerignore) và build frontend React
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=400" npm run build

# Chạy server Node.js full-stack (phục vụ cả frontend dist và API backend)
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
