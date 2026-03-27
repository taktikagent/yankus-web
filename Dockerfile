FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --build-from-source

COPY . .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]
