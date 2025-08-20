FROM node:18-alpine
WORKDIR /app
COPY app/package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm","start"]