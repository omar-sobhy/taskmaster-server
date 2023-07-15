FROM node:current-slim
WORKDIR /taskmaster/app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "run", "dev"]