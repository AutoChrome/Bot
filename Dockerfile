FROM node:latest

WORKDIR /Summoners-War-Helper
COPY . /Summoners-War-Helper

RUN npm install -g npm@8.17.0

CMD ["node", "index.js"]