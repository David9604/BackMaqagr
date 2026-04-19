FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY src/ ./src/
COPY database/ ./database/

EXPOSE 4000

CMD ["node", "src/app.js"]
