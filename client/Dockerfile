FROM node:22-alpine
WORKDIR /app
ARG API_URL=http://backend:8001
ENV API_URL=$API_URL
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
