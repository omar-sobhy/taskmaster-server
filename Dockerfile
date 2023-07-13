FROM node:current-alpine
WORKDIR /taskmaster/app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "run", "dev"]