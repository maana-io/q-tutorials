FROM node:alpine

COPY . .

RUN npm ci

RUN npm run build

RUN npm install -g serve

CMD serve -s -l 3000 build

EXPOSE 3000