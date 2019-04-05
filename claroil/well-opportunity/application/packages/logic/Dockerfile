FROM node:lts
ENV PORT 4000
EXPOSE 4000

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

CMD ["npm", "start"]
