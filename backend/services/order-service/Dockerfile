FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3004

CMD ["sh", "-c", "NODE_OPTIONS=--dns-result-order=ipv4first npm start"]
