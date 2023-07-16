FROM node:current-slim
WORKDIR /taskmaster/app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "dev"]