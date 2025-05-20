FROM node:20 as dependencies
WORKDIR /usr/src/app
COPY package*.json  ./
RUN npm install
RUN mkdir -p /usr/src/app/node_modules && chown -R node:node /usr/src/app
USER node
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
