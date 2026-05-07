FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund --omit=dev=false

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
