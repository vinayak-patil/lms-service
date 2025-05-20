FROM node:20 as dependencies
WORKDIR /usr/app/src
COPY package*.json  ./
RUN npm install
RUN mkdir -p /usr/app/src/node_modules && chown -R node:node /usr/app/src
USER node
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]