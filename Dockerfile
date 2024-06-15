FROM node:20-alpine AS builder

WORKDIR /user/src/be-app

COPY . .

RUN npm install && npm run build

RUN chmod -R 777 /user/src/be-app/public/*

VOLUME /user/src/be-app/public

USER node

CMD ["npm", "run", "start:prod"]
